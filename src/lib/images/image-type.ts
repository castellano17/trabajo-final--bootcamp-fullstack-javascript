export type ImageType =
  | { extension: "jpg"; contentType: "image/jpeg" }
  | { extension: "png"; contentType: "image/png" }
  | { extension: "webp"; contentType: "image/webp" };

const jpegSignature = [0xff, 0xd8, 0xff];
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const riffSignature = [0x52, 0x49, 0x46, 0x46];
const webpSignature = [0x57, 0x45, 0x42, 0x50];

function startsWithAt(
  bytes: Uint8Array,
  signature: number[],
  offset = 0,
): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWithAt(bytes, jpegSignature)) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (startsWithAt(bytes, pngSignature)) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    startsWithAt(bytes, riffSignature) &&
    startsWithAt(bytes, webpSignature, 8)
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}
