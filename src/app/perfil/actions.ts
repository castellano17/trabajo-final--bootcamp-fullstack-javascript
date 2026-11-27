"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type FormState,
  readFormField,
  validationErrorState,
} from "@/lib/forms/form-state";
import { logger } from "@/lib/logger";
import { avatarBucket, avatarMaxBytes } from "@/lib/profile/avatar-config";
import { detectImageType } from "@/lib/profile/image-type";
import { avatarFileSchema, displayNameSchema } from "@/lib/profile/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

const saveFailedState: FormState = {
  status: "error",
  message: "No pudimos guardar los cambios. Inténtalo de nuevo.",
};

const unsupportedImageMessage = "Elige una imagen JPEG, PNG o WebP.";

async function getSignedInUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    redirect("/iniciar-sesion?next=/perfil");
  }
  return { supabase, userId };
}

async function readAvatarPath(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  return data?.avatar_url ?? null;
}

async function deleteAvatarFile(
  supabase: SupabaseServerClient,
  userId: string,
  path: string,
) {
  const { error } = await supabase.storage.from(avatarBucket).remove([path]);
  if (error) {
    logger.warn("profile.update.failed", {
      userId,
      reason: error.statusCode ?? "avatar_delete_failed",
    });
  }
}

function refreshProfileViews() {
  revalidatePath("/", "layout");
}

export async function updateDisplayName(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getSignedInUser();

  const parsed = displayNameSchema.safeParse({
    displayName: readFormField(formData, "displayName"),
  });
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", userId);
  if (error) {
    logger.warn("profile.update.failed", { userId, reason: error.code });
    return saveFailedState;
  }

  logger.info("profile.display_name.updated", { userId });
  refreshProfileViews();
  return { status: "success", message: "Guardamos tu nombre." };
}

export async function updateAvatar(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getSignedInUser();

  const avatar = formData.get("avatar");
  const parsed = avatarFileSchema.safeParse({ avatar });
  if (!parsed.success) {
    if (avatar instanceof File && avatar.size > avatarMaxBytes) {
      logger.warn("profile.avatar.rejected", { userId, reason: "too_large" });
    }
    return validationErrorState(parsed.error);
  }

  const bytes = new Uint8Array(await parsed.data.avatar.arrayBuffer());
  const imageType = detectImageType(bytes);
  if (!imageType) {
    logger.warn("profile.avatar.rejected", {
      userId,
      reason: "unsupported_type",
    });
    return {
      status: "error",
      message: unsupportedImageMessage,
      fieldErrors: { avatar: [unsupportedImageMessage] },
    };
  }

  const previousPath = await readAvatarPath(supabase, userId);
  const newPath = `${userId}/${crypto.randomUUID()}.${imageType.extension}`;

  const { error: uploadError } = await supabase.storage
    .from(avatarBucket)
    .upload(newPath, bytes, {
      contentType: imageType.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) {
    logger.warn("profile.update.failed", {
      userId,
      reason: uploadError.statusCode ?? "avatar_upload_failed",
    });
    return saveFailedState;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: newPath })
    .eq("id", userId);
  if (profileError) {
    logger.warn("profile.update.failed", {
      userId,
      reason: profileError.code,
    });
    await deleteAvatarFile(supabase, userId, newPath);
    return saveFailedState;
  }

  if (previousPath) {
    await deleteAvatarFile(supabase, userId, previousPath);
  }

  logger.info("profile.avatar.updated", { userId });
  refreshProfileViews();
  return { status: "success", message: "Guardamos tu foto." };
}

export async function removeAvatar(): Promise<FormState> {
  const { supabase, userId } = await getSignedInUser();

  const previousPath = await readAvatarPath(supabase, userId);
  if (!previousPath) {
    return { status: "success", message: "Quitamos tu foto." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);
  if (error) {
    logger.warn("profile.update.failed", { userId, reason: error.code });
    return saveFailedState;
  }

  await deleteAvatarFile(supabase, userId, previousPath);

  logger.info("profile.avatar.removed", { userId });
  refreshProfileViews();
  return { status: "success", message: "Quitamos tu foto." };
}
