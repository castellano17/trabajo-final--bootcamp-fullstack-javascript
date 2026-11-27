"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useRef } from "react";

import type { ReviewPhotos } from "@/components/reviews/use-review-photos";
import { Button } from "@/components/ui/button";
import { reviewPhotoMaxCount } from "@/lib/reviews/config";

type PhotoTileProps = {
  url: string;
  alt: string;
  removeLabel: string;
  onRemove: () => void;
  disabled: boolean;
};

function PhotoTile({
  url,
  alt,
  removeLabel,
  onRemove,
  disabled,
}: PhotoTileProps) {
  return (
    <li className="relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
      <Image src={url} alt={alt} fill unoptimized className="object-cover" />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        onClick={onRemove}
        disabled={disabled}
        className="absolute top-1.5 right-1.5 size-7 rounded-full shadow-sm"
      >
        <X aria-hidden="true" />
        <span className="sr-only">{removeLabel}</span>
      </Button>
    </li>
  );
}

type ReviewPhotoPickerProps = {
  photos: ReviewPhotos;
  errors?: string[];
  disabled: boolean;
};

export function ReviewPhotoPicker({
  photos,
  errors,
  disabled,
}: ReviewPhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const error = photos.selectionError ?? errors?.[0];
  const isBusy = disabled || photos.isPreparing;

  function handleFilesChosen(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    void photos.addFiles(files);
  }

  return (
    <section aria-labelledby="review-photos-heading" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="review-photos-heading"
          className="text-sm leading-none font-medium"
        >
          Fotos (opcional, hasta {reviewPhotoMaxCount})
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy || !photos.canAddPhotos}
        >
          <ImagePlus data-icon="inline-start" aria-hidden="true" />
          {photos.isPreparing ? "Preparando fotos…" : "Agregar fotos"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-label="Elegir fotos"
          onChange={handleFilesChosen}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      {(photos.keptPhotos.length > 0 || photos.newPhotos.length > 0) && (
        <ul aria-label="Fotos de la reseña" className="grid grid-cols-3 gap-3">
          {photos.keptPhotos.map((photo, index) => (
            <PhotoTile
              key={photo.id}
              url={photo.url}
              alt={`Foto ${index + 1} de tu reseña`}
              removeLabel={`Quitar foto ${index + 1}`}
              onRemove={() => photos.removeStoredPhoto(photo.id)}
              disabled={isBusy}
            />
          ))}
          {photos.newPhotos.map((photo, index) => {
            const position = photos.keptPhotos.length + index + 1;
            return (
              <PhotoTile
                key={photo.previewUrl}
                url={photo.previewUrl}
                alt={`Foto ${position} de tu reseña`}
                removeLabel={`Quitar foto ${position}`}
                onRemove={() => photos.removeNewPhoto(photo.previewUrl)}
                disabled={isBusy}
              />
            );
          })}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
