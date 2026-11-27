import { describe, expect, it } from "vitest";

import { reviewPhotoMaxCount } from "@/lib/reviews/config";
import { photoCountAfterEdit } from "@/lib/reviews/photo-count";

const currentPhotoIds = ["photo-1", "photo-2", "photo-3"];

describe("photoCountAfterEdit", () => {
  it("allows replacing one of three photos with a new one", () => {
    const count = photoCountAfterEdit({
      currentPhotoIds,
      removedPhotoIds: ["photo-2"],
      newPhotoCount: 1,
    });

    expect(count).toBe(3);
    expect(count).toBeLessThanOrEqual(reviewPhotoMaxCount);
  });

  it("goes over the limit when a fourth photo is added to three", () => {
    const count = photoCountAfterEdit({
      currentPhotoIds,
      removedPhotoIds: [],
      newPhotoCount: 1,
    });

    expect(count).toBe(4);
    expect(count).toBeGreaterThan(reviewPhotoMaxCount);
  });

  it("ignores removed ids that are repeated or do not belong to the review", () => {
    expect(
      photoCountAfterEdit({
        currentPhotoIds,
        removedPhotoIds: ["photo-1", "photo-1", "someone-else-photo"],
        newPhotoCount: 2,
      }),
    ).toBe(4);
  });
});
