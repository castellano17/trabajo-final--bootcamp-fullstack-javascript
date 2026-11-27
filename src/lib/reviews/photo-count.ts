type PhotoEdit = {
  currentPhotoIds: string[];
  removedPhotoIds: string[];
  newPhotoCount: number;
};

export function photoCountAfterEdit({
  currentPhotoIds,
  removedPhotoIds,
  newPhotoCount,
}: PhotoEdit): number {
  const keptPhotoCount = currentPhotoIds.filter(
    (photoId) => !removedPhotoIds.includes(photoId),
  ).length;
  return keptPhotoCount + newPhotoCount;
}
