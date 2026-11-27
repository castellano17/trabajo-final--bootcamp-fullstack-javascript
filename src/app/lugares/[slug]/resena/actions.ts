"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  fieldErrorState,
  type FormState,
  readFormField,
  validationErrorState,
} from "@/lib/forms/form-state";
import { detectImageType, type ImageType } from "@/lib/images/image-type";
import { logger } from "@/lib/logger";
import { placePath, placeReviewPath } from "@/lib/places/paths";
import { getPlaceSlug } from "@/lib/places/queries";
import { placeIdSchema } from "@/lib/places/schemas";
import {
  reviewPhotoBucket,
  reviewPhotoMaxBytes,
  reviewPhotoMaxCount,
} from "@/lib/reviews/config";
import { tooManyPhotosMessage } from "@/lib/reviews/messages";
import { photoCountAfterEdit } from "@/lib/reviews/photo-count";
import {
  removeReviewPhotoFiles,
  uploadReviewPhotos,
} from "@/lib/reviews/photo-storage";
import { type ReviewForm, reviewFormSchema } from "@/lib/reviews/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type DetectedPhoto = { bytes: Uint8Array; imageType: ImageType };

type OwnReviewSummary = { id: string; photoIds: string[] };

type PhotoChanges = { uploadedPaths: string[]; detachedPaths: string[] };

type ReviewWriter = {
  supabase: SupabaseServerClient;
  userId: string;
  placeId: string;
};

const uniqueViolationCode = "23505";
const checkViolationCode = "23514";

const saveFailedState: FormState = {
  status: "error",
  message: "No pudimos guardar tu reseña. Inténtalo de nuevo.",
};

const duplicateReviewState: FormState = {
  status: "error",
  message: "Ya escribiste una reseña de este lugar.",
};

const unsupportedPhotoMessage = "Elige fotos JPEG, PNG o WebP.";

async function getSignedInUser(placeSlug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    redirect(
      `/iniciar-sesion?next=${encodeURIComponent(placeReviewPath(placeSlug))}`,
    );
  }
  return { supabase, userId };
}

function parseReviewForm(formData: FormData) {
  return reviewFormSchema.safeParse({
    rating: readFormField(formData, "rating"),
    body: readFormField(formData, "body"),
    photos: formData.getAll("photos"),
    removedPhotoIds: formData.getAll("removedPhotoIds"),
  });
}

function hasTooLargePhoto(formData: FormData): boolean {
  return formData
    .getAll("photos")
    .some((photo) => photo instanceof File && photo.size > reviewPhotoMaxBytes);
}

async function detectPhotos(photos: File[]): Promise<DetectedPhoto[] | null> {
  const detectedPhotos: DetectedPhoto[] = [];
  for (const photo of photos) {
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const imageType = detectImageType(bytes);
    if (!imageType) {
      return null;
    }
    detectedPhotos.push({ bytes, imageType });
  }
  return detectedPhotos;
}

async function readOwnReview({
  supabase,
  userId,
  placeId,
}: ReviewWriter): Promise<OwnReviewSummary | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, photos:review_photos(id)")
    .eq("place_id", placeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load own review: ${error.code}`);
  }
  return data
    ? { id: data.id, photoIds: data.photos.map((photo) => photo.id) }
    : null;
}

async function uploadPhotoFiles(
  { supabase, userId }: ReviewWriter,
  reviewId: string,
  detectedPhotos: DetectedPhoto[],
): Promise<string[] | null> {
  const upload = await uploadReviewPhotos(
    supabase.storage.from(reviewPhotoBucket),
    detectedPhotos.map(({ bytes, imageType }) => ({
      path: `${userId}/${reviewId}/${crypto.randomUUID()}.${imageType.extension}`,
      bytes,
      contentType: imageType.contentType,
    })),
  );
  if (upload.uploaded) {
    return upload.paths;
  }
  logger.warn("review.save_failed", {
    userId,
    reviewId,
    reason: "photo_upload_failed",
  });
  return null;
}

async function removePhotoFiles(
  { supabase, userId }: ReviewWriter,
  reviewId: string,
  storagePaths: string[],
) {
  const removalError = await removeReviewPhotoFiles(
    supabase.storage.from(reviewPhotoBucket),
    storagePaths,
  );
  if (removalError) {
    logger.warn("review.save_failed", {
      userId,
      reviewId,
      reason: "photo_delete_failed",
    });
  }
}

async function insertPhotoRows(
  { supabase, userId }: ReviewWriter,
  reviewId: string,
  storagePaths: string[],
): Promise<FormState | null> {
  if (storagePaths.length === 0) {
    return null;
  }

  const { error } = await supabase
    .from("review_photos")
    .insert(
      storagePaths.map((path) => ({ review_id: reviewId, storage_path: path })),
    );
  if (!error) {
    return null;
  }
  logger.warn("review.save_failed", { userId, reviewId, reason: error.code });
  return error.code === checkViolationCode
    ? fieldErrorState("photos", tooManyPhotosMessage)
    : saveFailedState;
}

async function detachPhotoRows(
  { supabase, userId }: ReviewWriter,
  reviewId: string,
  removedPhotoIds: string[],
): Promise<string[] | null> {
  if (removedPhotoIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("review_photos")
    .delete()
    .eq("review_id", reviewId)
    .in("id", removedPhotoIds)
    .select("storage_path");
  if (error) {
    logger.warn("review.save_failed", { userId, reviewId, reason: error.code });
    return null;
  }
  return data.map((photo) => photo.storage_path);
}

async function revertPhotoChanges(
  writer: ReviewWriter,
  reviewId: string,
  { uploadedPaths, detachedPaths }: PhotoChanges,
) {
  if (uploadedPaths.length > 0) {
    await writer.supabase
      .from("review_photos")
      .delete()
      .eq("review_id", reviewId)
      .in("storage_path", uploadedPaths);
  }
  await removePhotoFiles(writer, reviewId, uploadedPaths);
  await insertPhotoRows(writer, reviewId, detachedPaths);
}

async function createReview(
  writer: ReviewWriter,
  { rating, body }: ReviewForm,
  detectedPhotos: DetectedPhoto[],
): Promise<FormState | null> {
  const { supabase, userId, placeId } = writer;
  const { data, error } = await supabase
    .from("reviews")
    .insert({ place_id: placeId, user_id: userId, rating, body })
    .select("id")
    .single();
  if (error) {
    logger.warn("review.save_failed", { userId, placeId, reason: error.code });
    return error.code === uniqueViolationCode
      ? duplicateReviewState
      : saveFailedState;
  }

  const uploadedPaths = await uploadPhotoFiles(writer, data.id, detectedPhotos);
  const photoError = uploadedPaths
    ? await insertPhotoRows(writer, data.id, uploadedPaths)
    : saveFailedState;
  if (photoError) {
    await removePhotoFiles(writer, data.id, uploadedPaths ?? []);
    await supabase.from("reviews").delete().eq("id", data.id);
    return photoError;
  }

  logger.info("review.created", { userId, placeId, reviewId: data.id });
  return null;
}

async function updateReview(
  writer: ReviewWriter,
  reviewId: string,
  { rating, body, removedPhotoIds }: ReviewForm,
  detectedPhotos: DetectedPhoto[],
): Promise<FormState | null> {
  const { supabase, userId, placeId } = writer;
  const uploadedPaths = await uploadPhotoFiles(
    writer,
    reviewId,
    detectedPhotos,
  );
  if (!uploadedPaths) {
    return saveFailedState;
  }

  const detachedPaths = await detachPhotoRows(
    writer,
    reviewId,
    removedPhotoIds,
  );
  if (!detachedPaths) {
    await removePhotoFiles(writer, reviewId, uploadedPaths);
    return saveFailedState;
  }

  const photoChanges = { uploadedPaths, detachedPaths };
  const photoError = await insertPhotoRows(writer, reviewId, uploadedPaths);
  if (photoError) {
    await revertPhotoChanges(writer, reviewId, photoChanges);
    return photoError;
  }

  const { error } = await supabase
    .from("reviews")
    .update({ rating, body })
    .eq("id", reviewId);
  if (error) {
    logger.warn("review.save_failed", { userId, reviewId, reason: error.code });
    await revertPhotoChanges(writer, reviewId, photoChanges);
    return saveFailedState;
  }

  await removePhotoFiles(writer, reviewId, detachedPaths);
  logger.info("review.updated", { userId, placeId, reviewId });
  return null;
}

function refreshReviewViews(placeSlug: string): never {
  revalidatePath(placePath(placeSlug));
  revalidatePath("/lugares");
  revalidatePath("/");
  redirect(placePath(placeSlug));
}

export async function saveReview(
  placeId: string,
  expectedReviewId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const placeSlug = placeIdSchema.safeParse(placeId).success
    ? await getPlaceSlug(placeId)
    : null;
  if (!placeSlug) {
    return saveFailedState;
  }
  const { supabase, userId } = await getSignedInUser(placeSlug);
  const writer: ReviewWriter = { supabase, userId, placeId };

  const parsed = parseReviewForm(formData);
  if (!parsed.success) {
    if (hasTooLargePhoto(formData)) {
      logger.warn("review.photo.rejected", { userId, reason: "too_large" });
    }
    return validationErrorState(parsed.error);
  }

  const ownReview = await readOwnReview(writer);
  if (ownReview && ownReview.id !== expectedReviewId) {
    return duplicateReviewState;
  }
  if (!ownReview && expectedReviewId) {
    return saveFailedState;
  }

  const photoCount = photoCountAfterEdit({
    currentPhotoIds: ownReview?.photoIds ?? [],
    removedPhotoIds: parsed.data.removedPhotoIds,
    newPhotoCount: parsed.data.photos.length,
  });
  if (photoCount > reviewPhotoMaxCount) {
    logger.warn("review.photo.rejected", { userId, reason: "too_many" });
    return fieldErrorState("photos", tooManyPhotosMessage);
  }

  const detectedPhotos = await detectPhotos(parsed.data.photos);
  if (!detectedPhotos) {
    logger.warn("review.photo.rejected", {
      userId,
      reason: "unsupported_type",
    });
    return fieldErrorState("photos", unsupportedPhotoMessage);
  }

  const errorState = ownReview
    ? await updateReview(writer, ownReview.id, parsed.data, detectedPhotos)
    : await createReview(writer, parsed.data, detectedPhotos);
  if (errorState) {
    return errorState;
  }

  refreshReviewViews(placeSlug);
}

const deleteFailedState: FormState = {
  status: "error",
  message: "No pudimos borrar tu reseña. Inténtalo de nuevo.",
};

export async function deleteReview(placeId: string): Promise<FormState> {
  const placeSlug = placeIdSchema.safeParse(placeId).success
    ? await getPlaceSlug(placeId)
    : null;
  if (!placeSlug) {
    return deleteFailedState;
  }
  const { supabase, userId } = await getSignedInUser(placeSlug);

  const { data: review, error: readError } = await supabase
    .from("reviews")
    .select("id, photos:review_photos(storage_path)")
    .eq("place_id", placeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError || !review) {
    logger.warn("review.delete_failed", {
      userId,
      placeId,
      reason: readError?.code ?? "not_found",
    });
    return deleteFailedState;
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", review.id)
    .select("id")
    .single();
  if (error) {
    logger.warn("review.delete_failed", {
      userId,
      reviewId: review.id,
      reason: error.code,
    });
    return deleteFailedState;
  }

  const removalError = await removeReviewPhotoFiles(
    supabase.storage.from(reviewPhotoBucket),
    review.photos.map((photo) => photo.storage_path),
  );
  if (removalError) {
    logger.warn("review.delete_failed", {
      userId,
      reviewId: review.id,
      reason: "photo_delete_failed",
    });
  }

  logger.info("review.deleted", { userId, placeId, reviewId: review.id });
  refreshReviewViews(placeSlug);
}
