"use client";

import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ReviewPhoto = { id: string; url: string };

type ReviewPhotosProps = {
  photos: ReviewPhoto[];
  authorName: string;
};

export function ReviewPhotos({ photos, authorName }: ReviewPhotosProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={`Fotos de la reseña de ${authorName}`}
      className="flex flex-wrap gap-2 px-5 pb-5"
    >
      {photos.map((photo, index) => {
        const photoLabel = `Foto ${index + 1} de la reseña de ${authorName}`;
        return (
          <li key={photo.id}>
            <Dialog>
              <DialogTrigger className="relative block size-20 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-24">
                <Image
                  src={photo.url}
                  alt={photoLabel}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </DialogTrigger>
              <DialogContent className="gap-3 p-3 sm:max-w-3xl">
                <DialogTitle className="sr-only">{photoLabel}</DialogTitle>
                <DialogDescription className="sr-only">
                  Foto en tamaño grande.
                </DialogDescription>
                <div className="relative h-[70vh] w-full overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={photo.url}
                    alt={photoLabel}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </li>
        );
      })}
    </ul>
  );
}
