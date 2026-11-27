"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import {
  type FormState,
  readFormField,
  validationErrorState,
} from "@/lib/forms/form-state";
import { logger } from "@/lib/logger";
import { placePath } from "@/lib/places/paths";
import { placeFormSchema, placeIdSchema } from "@/lib/places/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const notAllowedState: FormState = {
  status: "error",
  message: "Solo un administrador puede gestionar lugares.",
};

const saveFailedState: FormState = {
  status: "error",
  message: "No pudimos guardar los cambios. Inténtalo de nuevo.",
};

async function getAdminUserId(): Promise<string | null> {
  const currentUser = await getCurrentUser();
  return isAdmin(currentUser) ? (currentUser?.id ?? null) : null;
}

function parsePlaceForm(formData: FormData) {
  return placeFormSchema.safeParse({
    name: readFormField(formData, "name"),
    category: readFormField(formData, "category"),
    address: readFormField(formData, "address"),
    description: readFormField(formData, "description"),
  });
}

export async function createPlace(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getAdminUserId();
  if (!userId) {
    return notAllowedState;
  }

  const parsed = parsePlaceForm(formData);
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .insert(parsed.data)
    .select("id, slug")
    .single();
  if (error) {
    logger.warn("place.save_failed", { userId, reason: error.code });
    return saveFailedState;
  }

  logger.info("place.created", { userId, placeId: data.id });
  revalidatePath("/lugares");
  redirect(placePath(data.slug));
}

export async function updatePlace(
  placeId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getAdminUserId();
  if (!userId || !placeIdSchema.safeParse(placeId).success) {
    return notAllowedState;
  }

  const parsed = parsePlaceForm(formData);
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .update(parsed.data)
    .eq("id", placeId)
    .select("slug")
    .single();
  if (error) {
    logger.warn("place.save_failed", {
      userId,
      placeId,
      reason: error.code,
    });
    return saveFailedState;
  }

  logger.info("place.updated", { userId, placeId });
  revalidatePath("/lugares");
  revalidatePath(placePath(data.slug));
  redirect(placePath(data.slug));
}

export async function deletePlace(placeId: string): Promise<FormState> {
  const userId = await getAdminUserId();
  if (!userId || !placeIdSchema.safeParse(placeId).success) {
    return notAllowedState;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("places")
    .delete()
    .eq("id", placeId)
    .select("id")
    .single();
  if (error) {
    logger.warn("place.save_failed", {
      userId,
      placeId,
      reason: error.code,
    });
    return saveFailedState;
  }

  logger.info("place.deleted", { userId, placeId });
  revalidatePath("/lugares");
  redirect("/lugares");
}
