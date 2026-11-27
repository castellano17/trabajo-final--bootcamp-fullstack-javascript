type StorageResult = Promise<{ error: { message: string } | null }>;

export type PhotoBucket = {
  upload: (
    path: string,
    bytes: Uint8Array,
    options: { contentType: string; cacheControl: string; upsert: boolean },
  ) => StorageResult;
  remove: (paths: string[]) => StorageResult;
};

export type PhotoUpload = {
  path: string;
  bytes: Uint8Array;
  contentType: string;
};

type UploadResult =
  { uploaded: true; paths: string[] } | { uploaded: false; reason: string };

const oneYearInSeconds = "31536000";

export async function removeReviewPhotoFiles(
  bucket: PhotoBucket,
  paths: string[],
): Promise<string | null> {
  if (paths.length === 0) {
    return null;
  }
  const { error } = await bucket.remove(paths);
  return error?.message ?? null;
}

export async function uploadReviewPhotos(
  bucket: PhotoBucket,
  uploads: PhotoUpload[],
): Promise<UploadResult> {
  const uploadedPaths: string[] = [];
  for (const { path, bytes, contentType } of uploads) {
    const { error } = await bucket.upload(path, bytes, {
      contentType,
      cacheControl: oneYearInSeconds,
      upsert: false,
    });
    if (error) {
      await removeReviewPhotoFiles(bucket, uploadedPaths);
      return { uploaded: false, reason: error.message };
    }
    uploadedPaths.push(path);
  }
  return { uploaded: true, paths: uploadedPaths };
}
