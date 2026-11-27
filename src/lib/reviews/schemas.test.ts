import { describe, expect, it } from "vitest";
import { z } from "zod";

import { reviewPhotoMaxBytes } from "@/lib/reviews/config";
import { reviewFormSchema } from "@/lib/reviews/schemas";

function photoOf(sizeInBytes: number): File {
  return new File([new Uint8Array(sizeInBytes)], "photo.webp", {
    type: "image/webp",
  });
}

function reviewFormOf(overrides: Record<string, unknown> = {}) {
  return {
    rating: "4",
    body: "Muy buenos tacos.",
    photos: [],
    removedPhotoIds: [],
    ...overrides,
  };
}

function fieldErrorsOf(input: Record<string, unknown>) {
  const result = reviewFormSchema.safeParse(reviewFormOf(input));
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("reviewFormSchema", () => {
  it("accepts a rating from 1 to 5 and trims the text", () => {
    expect(
      reviewFormSchema.parse(reviewFormOf({ rating: "5", body: "  Rico  " })),
    ).toEqual({ rating: 5, body: "Rico", photos: [], removedPhotoIds: [] });
  });

  it("asks for a rating when it is missing, 0 or 6", () => {
    for (const rating of ["", "0", "6", "tres"]) {
      expect(fieldErrorsOf({ rating }).rating).toEqual(["Elige un puntaje."]);
    }
  });

  it("rejects a text that is empty, only spaces or longer than 2000 characters", () => {
    expect(fieldErrorsOf({ body: "" }).body).toEqual(["Escribe tu reseña."]);
    expect(fieldErrorsOf({ body: "   " }).body).toEqual(["Escribe tu reseña."]);
    expect(fieldErrorsOf({ body: "a".repeat(2001) }).body).toEqual([
      "La reseña no puede superar los 2000 caracteres.",
    ]);
    expect(fieldErrorsOf({ body: "a".repeat(2000) }).body).toBeUndefined();
  });

  it("rejects a photo larger than 2 MB", () => {
    expect(
      fieldErrorsOf({ photos: [photoOf(reviewPhotoMaxBytes)] }).photos,
    ).toBeUndefined();
    expect(
      fieldErrorsOf({ photos: [photoOf(reviewPhotoMaxBytes + 1)] }).photos,
    ).toEqual(["Cada foto puede pesar hasta 2 MB."]);
  });

  it("rejects removed photo ids that are not ids", () => {
    expect(
      fieldErrorsOf({ removedPhotoIds: ["../otra-foto"] }).removedPhotoIds,
    ).toBeDefined();
  });
});
