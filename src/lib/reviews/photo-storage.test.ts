import { describe, expect, it } from "vitest";

import {
  type PhotoBucket,
  type PhotoUpload,
  uploadReviewPhotos,
} from "@/lib/reviews/photo-storage";

function photoUploadOf(name: string): PhotoUpload {
  return {
    path: `user/review/${name}.webp`,
    bytes: new Uint8Array([1, 2, 3]),
    contentType: "image/webp",
  };
}

function fakeBucket({ failingUploadNumber }: { failingUploadNumber: number }) {
  const uploadedPaths: string[] = [];
  const removedPaths: string[] = [];
  const bucket: PhotoBucket = {
    async upload(path) {
      if (uploadedPaths.length + 1 === failingUploadNumber) {
        return { error: { message: "Storage is down" } };
      }
      uploadedPaths.push(path);
      return { error: null };
    },
    async remove(paths) {
      removedPaths.push(...paths);
      return { error: null };
    },
  };
  return { bucket, uploadedPaths, removedPaths };
}

describe("uploadReviewPhotos", () => {
  it("when a photo fails to upload, removes the photos already uploaded and returns the error", async () => {
    const { bucket, uploadedPaths, removedPaths } = fakeBucket({
      failingUploadNumber: 2,
    });
    const uploads = ["first", "second", "third"].map(photoUploadOf);

    const result = await uploadReviewPhotos(bucket, uploads);

    expect(result).toEqual({ uploaded: false, reason: "Storage is down" });
    expect(uploadedPaths).toEqual(["user/review/first.webp"]);
    expect(removedPaths).toEqual(["user/review/first.webp"]);
  });

  it("uploads every photo and returns their paths when nothing fails", async () => {
    const { bucket, removedPaths } = fakeBucket({ failingUploadNumber: 0 });
    const uploads = ["first", "second"].map(photoUploadOf);

    const result = await uploadReviewPhotos(bucket, uploads);

    expect(result).toEqual({
      uploaded: true,
      paths: ["user/review/first.webp", "user/review/second.webp"],
    });
    expect(removedPaths).toEqual([]);
  });
});
