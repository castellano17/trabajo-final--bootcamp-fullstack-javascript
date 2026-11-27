"use client";

import { useEffect, useRef, useState } from "react";

import { resizeImageToWebp } from "@/lib/images/resize-image";
import {
  reviewPhotoMaxBytes,
  reviewPhotoMaxCount,
  reviewPhotoMaxDimensionInPixels,
} from "@/lib/reviews/config";
import {
  tooLargePhotoMessage,
  tooManyPhotosMessage,
} from "@/lib/reviews/messages";

export type StoredPhoto = { id: string; url: string };

export type NewPhoto = { file: File; previewUrl: string };

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const unreadablePhotoMessage =
  "No pudimos leer esta foto. Prueba con JPEG, PNG o WebP.";

async function preparePhotos(files: File[]): Promise<File[] | string> {
  if (files.some((file) => !acceptedImageTypes.includes(file.type))) {
    return unreadablePhotoMessage;
  }
  try {
    const photos = await Promise.all(
      files.map((file) =>
        resizeImageToWebp(file, reviewPhotoMaxDimensionInPixels),
      ),
    );
    return photos.some((photo) => photo.size > reviewPhotoMaxBytes)
      ? tooLargePhotoMessage
      : photos;
  } catch {
    return unreadablePhotoMessage;
  }
}

export function useReviewPhotos(storedPhotos: StoredPhoto[]) {
  const [keptPhotos, setKeptPhotos] = useState(storedPhotos);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const newPhotosRef = useRef(newPhotos);
  const photoCount = keptPhotos.length + newPhotos.length;

  useEffect(() => {
    newPhotosRef.current = newPhotos;
  }, [newPhotos]);

  useEffect(() => {
    const photosToRelease = newPhotosRef;
    return () => {
      for (const photo of photosToRelease.current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, []);

  async function addFiles(files: File[]) {
    setSelectionError(null);
    if (files.length === 0) {
      return;
    }
    if (photoCount + files.length > reviewPhotoMaxCount) {
      setSelectionError(tooManyPhotosMessage);
      return;
    }

    setIsPreparing(true);
    const prepared = await preparePhotos(files);
    setIsPreparing(false);
    if (typeof prepared === "string") {
      setSelectionError(prepared);
      return;
    }
    setNewPhotos((photos) => [
      ...photos,
      ...prepared.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeStoredPhoto(photoId: string) {
    setSelectionError(null);
    setKeptPhotos((photos) => photos.filter((photo) => photo.id !== photoId));
    setRemovedPhotoIds((photoIds) => [...photoIds, photoId]);
  }

  function removeNewPhoto(previewUrl: string) {
    setSelectionError(null);
    URL.revokeObjectURL(previewUrl);
    setNewPhotos((photos) =>
      photos.filter((photo) => photo.previewUrl !== previewUrl),
    );
  }

  function appendTo(formData: FormData) {
    for (const photo of newPhotos) {
      formData.append("photos", photo.file);
    }
    for (const photoId of removedPhotoIds) {
      formData.append("removedPhotoIds", photoId);
    }
  }

  return {
    keptPhotos,
    newPhotos,
    selectionError,
    isPreparing,
    canAddPhotos: photoCount < reviewPhotoMaxCount,
    addFiles,
    removeStoredPhoto,
    removeNewPhoto,
    appendTo,
  };
}

export type ReviewPhotos = ReturnType<typeof useReviewPhotos>;
