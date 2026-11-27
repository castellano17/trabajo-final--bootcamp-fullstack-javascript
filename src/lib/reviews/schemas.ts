import { z } from "zod";

import { reviewBodyMaxLength, reviewPhotoMaxBytes } from "@/lib/reviews/config";
import { tooLargePhotoMessage } from "@/lib/reviews/messages";

const missingRatingMessage = "Elige un puntaje.";

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
      .max(reviewPhotoMaxBytes, tooLargePhotoMessage),
  ),
  removedPhotoIds: z.array(z.guid()),
});

export type ReviewForm = z.infer<typeof reviewFormSchema>;
