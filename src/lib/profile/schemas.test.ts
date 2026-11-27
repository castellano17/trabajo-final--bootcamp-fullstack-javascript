import { describe, expect, it } from "vitest";

import { avatarMaxBytes } from "@/lib/profile/avatar-config";
import { avatarFileSchema, displayNameSchema } from "@/lib/profile/schemas";

function imageFileOf(sizeInBytes: number): File {
  return new File([new Uint8Array(sizeInBytes)], "avatar.webp", {
    type: "image/webp",
  });
}

describe("displayNameSchema", () => {
  it("trims the name and rejects an empty name or one longer than 50 characters", () => {
    expect(displayNameSchema.parse({ displayName: "  Ana  " })).toEqual({
      displayName: "Ana",
    });
    expect(displayNameSchema.safeParse({ displayName: "   " }).success).toBe(
      false,
    );
    expect(
      displayNameSchema.safeParse({ displayName: "a".repeat(51) }).success,
    ).toBe(false);
  });
});

describe("avatarFileSchema", () => {
  it("rejects a missing file and a file larger than 2 MB", () => {
    expect(
      avatarFileSchema.safeParse({ avatar: imageFileOf(avatarMaxBytes) })
        .success,
    ).toBe(true);
    expect(
      avatarFileSchema.safeParse({ avatar: imageFileOf(avatarMaxBytes + 1) })
        .success,
    ).toBe(false);
    expect(avatarFileSchema.safeParse({ avatar: imageFileOf(0) }).success).toBe(
      false,
    );
    expect(avatarFileSchema.safeParse({ avatar: "avatar.webp" }).success).toBe(
      false,
    );
  });
});
