"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import { Field } from "@/components/forms/field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  type FormAction,
  useFormAction,
} from "@/components/forms/use-form-action";
import { RatingInput } from "@/components/reviews/rating-input";
import { ReviewPhotoPicker } from "@/components/reviews/review-photo-picker";
import {
  type StoredPhoto,
  useReviewPhotos,
} from "@/components/reviews/use-review-photos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewBodyMaxLength } from "@/lib/reviews/config";

type ReviewFormValues = {
  rating: number;
  body: string;
  photos: StoredPhoto[];
};

type ReviewFormProps = {
  action: FormAction;
  cancelHref: string;
  review?: ReviewFormValues;
};

export function ReviewForm({ action, cancelHref, review }: ReviewFormProps) {
  const { state, fieldErrors, submitFormData, isPending } =
    useFormAction(action);
  const photos = useReviewPhotos(review?.photos ?? []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    photos.appendTo(formData);
    submitFormData(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      <RatingInput
        name="rating"
        defaultValue={review?.rating}
        errors={fieldErrors.rating}
      />
      <Field label="Tu reseña" errors={fieldErrors.body}>
        {(controlProps) => (
          <Textarea
            {...controlProps}
            name="body"
            rows={6}
            maxLength={reviewBodyMaxLength}
            defaultValue={review?.body}
            placeholder="¿Qué pediste? ¿Cómo estuvo la salsa, el servicio, el precio?"
            required
          />
        )}
      </Field>
      <ReviewPhotoPicker
        photos={photos}
        errors={fieldErrors.photos}
        disabled={isPending}
      />
      <FormStatusMessage state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          isPending={isPending || photos.isPreparing}
          pendingLabel={photos.isPreparing ? "Preparando fotos…" : "Guardando…"}
        >
          {review ? "Guardar cambios" : "Publicar reseña"}
        </SubmitButton>
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
