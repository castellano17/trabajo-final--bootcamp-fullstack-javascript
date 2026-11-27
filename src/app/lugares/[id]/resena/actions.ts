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

async function getSignedInUser(placeId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    redirect(
      `/iniciar-sesion?next=${encodeURIComponent(`/lugares/${placeId}/resena`)}`,
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

async function attachPhotos(
  { supabase, userId }: ReviewWriter,
  reviewId: string,
  detectedPhotos: DetectedPhoto[],
): Promise<FormState | null> {
  if (detectedPhotos.length === 0) {
    return null;
  }

  const bucket = supabase.storage.from(reviewPhotoBucket);
  const upload = await uploadReviewPhotos(
    bucket,
    detectedPhotos.map(({ bytes, imageType }) => ({
      path: `${userId}/${reviewId}/${crypto.randomUUID()}.${imageType.extension}`,
      bytes,
      contentType: imageType.contentType,
    })),
  );
  if (!upload.uploaded) {
    logger.warn("review.save_failed", {
      userId,
      reviewId,
      reason: "photo_upload_failed",
    });
    return saveFailedState;
  }

  const { error } = await supabase
    .from("review_photos")
    .insert(
      upload.paths.map((path) => ({ review_id: reviewId, storage_path: path })),
    );
  if (error) {
    await removeReviewPhotoFiles(bucket, upload.paths);
    logger.warn("review.save_failed", { userId, reviewId, reason: error.code });
    return error.code === checkViolationCode
      ? fieldErrorState("photos", tooManyPhotosMessage)
      : saveFailedState;
  }
  return null;
}

async function detachPhotos(
  { supabase, userId }: ReviewWriter,
  reviewId: string,
  removedPhotoIds: string[],
): Promise<FormState | null> {
  if (removedPhotoIds.length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("review_photos")
    .delete()
    .eq("review_id", reviewId)
    .in("id", removedPhotoIds)
    .select("storage_path");
  if (error) {
    logger.warn("review.save_failed", { userId, reviewId, reason: error.code });
    return saveFailedState;
  }

  const removalError = await removeReviewPhotoFiles(
    supabase.storage.from(reviewPhotoBucket),
    data.map((photo) => photo.storage_path),
  );
  if (removalError) {
    logger.warn("review.save_failed", {
      userId,
      reviewId,
      reason: "photo_delete_failed",
    });
  }
  return null;
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

  const photoError = await attachPhotos(writer, data.id, detectedPhotos);
  if (photoError) {
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
  const photoError = await attachPhotos(writer, reviewId, detectedPhotos);
  if (photoError) {
    return photoError;
  }

  const { error } = await supabase
    .from("reviews")
    .update({ rating, body })
    .eq("id", reviewId);
  if (error) {
    logger.warn("review.save_failed", { userId, reviewId, reason: error.code });
    return saveFailedState;
  }

  const removalError = await detachPhotos(writer, reviewId, removedPhotoIds);
  if (removalError) {
    return removalError;
  }

  logger.info("review.updated", { userId, placeId, reviewId });
  return null;
}

function refreshReviewViews(placeId: string): never {
  revalidatePath(`/lugares/${placeId}`);
  revalidatePath("/lugares");
  revalidatePath("/");
  redirect(`/lugares/${placeId}`);
}

export async function saveReview(
  placeId: string,
  expectedReviewId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!placeIdSchema.safeParse(placeId).success) {
    return saveFailedState;
  }
  const { supabase, userId } = await getSignedInUser(placeId);
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

  refreshReviewViews(placeId);
}

const deleteFailedState: FormState = {
  status: "error",
  message: "No pudimos borrar tu reseña. Inténtalo de nuevo.",
};

export async function deleteReview(placeId: string): Promise<FormState> {
  if (!placeIdSchema.safeParse(placeId).success) {
    return deleteFailedState;
  }
  const { supabase, userId } = await getSignedInUser(placeId);

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
  refreshReviewViews(placeId);
}
