import { z } from "zod";

import {
  reviewBodyMaxLength,
  reviewPhotoMaxBytes,
  reviewPhotoMaxCount,
} from "@/lib/reviews/config";

const missingRatingMessage = "Elige un puntaje.";

export const tooManyPhotosMessage = `Una reseña puede tener hasta ${reviewPhotoMaxCount} fotos.`;

export const reviewFormSchema = z.object({
  rating: z.coerce
    .number(missingRatingMessage)
    .int(missingRatingMessage)
    .min(1, missingRatingMessage)
    .max(5, missingRatingMessage),
  body: z
    .string()
    .trim()
    .min(1, "Escribe tu reseña.")
    .max(
      reviewBodyMaxLength,
      `La reseña no puede superar los ${reviewBodyMaxLength} caracteres.`,
    ),
  photos: z.array(
    z
      .file("Elige una foto.")
      .min(1, "Elige una foto.")
      .max(reviewPhotoMaxBytes, "Cada foto puede pesar hasta 2 MB."),
  ),
  removedPhotoIds: z.array(z.guid()),
});

export type ReviewForm = z.infer<typeof reviewFormSchema>;
