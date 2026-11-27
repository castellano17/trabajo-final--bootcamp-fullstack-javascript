import { avatarDimensionInPixels } from "@/lib/profile/avatar-config";

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function resizeToSquareAvatar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const sourceX = (bitmap.width - side) / 2;
  const sourceY = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = avatarDimensionInPixels;
  canvas.height = avatarDimensionInPixels;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 2D context is not available");
  }
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    side,
    side,
    0,
    0,
    avatarDimensionInPixels,
    avatarDimensionInPixels,
  );
  bitmap.close();

  const blob =
    (await canvasToBlob(canvas, "image/webp", 0.85)) ??
    (await canvasToBlob(canvas, "image/png"));
  if (!blob) {
    throw new Error("The avatar image could not be encoded");
  }

  const extension = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `avatar.${extension}`, { type: blob.type });
}
