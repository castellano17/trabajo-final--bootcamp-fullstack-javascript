import type { Area } from "react-easy-crop";

import { avatarDimensionInPixels } from "@/lib/profile/avatar-config";

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function cropAvatar(file: File, area: Area): Promise<File> {
  const bitmap = await createImageBitmap(
    file,
    Math.round(area.x),
    Math.round(area.y),
    Math.max(1, Math.round(area.width)),
    Math.max(1, Math.round(area.height)),
    {
      imageOrientation: "from-image",
      resizeWidth: avatarDimensionInPixels,
      resizeHeight: avatarDimensionInPixels,
      resizeQuality: "high",
    },
  );

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
