import { describe, expect, it } from "vitest";

import { detectImageType } from "@/lib/profile/image-type";

function bytesOf(...parts: (number[] | string)[]): Uint8Array {
  return Uint8Array.from(
    parts.flatMap((part) =>
      typeof part === "string"
        ? [...part].map((character) => character.charCodeAt(0))
        : part,
    ),
  );
}

describe("detectImageType", () => {
  it("recognizes JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImageType(bytesOf([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toEqual({
      extension: "jpg",
      contentType: "image/jpeg",
    });
    expect(
      detectImageType(
        bytesOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
      ),
    ).toEqual({ extension: "png", contentType: "image/png" });
    expect(
      detectImageType(bytesOf("RIFF", [0x24, 0x00, 0x00, 0x00], "WEBPVP8 ")),
    ).toEqual({ extension: "webp", contentType: "image/webp" });
  });

  it("rejects a file that is not an image even when it claims to be one", () => {
    expect(detectImageType(bytesOf("<html><script>alert(1)</script>"))).toBe(
      null,
    );
    expect(
      detectImageType(bytesOf("RIFF", [0x24, 0x00, 0x00, 0x00], "WAVEfmt ")),
    ).toBe(null);
    expect(
      detectImageType(bytesOf("JUNK", [0x24, 0x00, 0x00, 0x00], "WEBPVP8 ")),
    ).toBe(null);
    expect(detectImageType(bytesOf([0x89, 0x50, 0x4e]))).toBe(null);
    expect(detectImageType(new Uint8Array())).toBe(null);
  });
});
