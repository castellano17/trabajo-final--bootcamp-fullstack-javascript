const encodingQuality = 0.85;

const extensionByContentType: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

type RenderOptions = {
  width: number;
  height: number;
  baseName: string;
  fallbackType: "image/png" | "image/jpeg";
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, type, encodingQuality),
  );
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  fallbackType: RenderOptions["fallbackType"],
): Promise<Blob> {
  const webpBlob = await canvasToBlob(canvas, "image/webp");
  if (webpBlob?.type === "image/webp") {
    return webpBlob;
  }
  const fallbackBlob = await canvasToBlob(canvas, fallbackType);
  if (!fallbackBlob) {
    throw new Error("The image could not be encoded");
  }
  return fallbackBlob;
}

export async function renderBitmapAsImageFile(
  bitmap: ImageBitmap,
  { width, height, baseName, fallbackType }: RenderOptions,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 2D context is not available");
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await encodeCanvas(canvas, fallbackType);
  const extension = extensionByContentType[blob.type] ?? "webp";
  return new File([blob], `${baseName}.${extension}`, { type: blob.type });
}

export async function resizeImageToWebp(
  file: File,
  maxDimensionInPixels: number,
): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(
    1,
    maxDimensionInPixels / Math.max(bitmap.width, bitmap.height),
  );
  return renderBitmapAsImageFile(bitmap, {
    width: Math.max(1, Math.round(bitmap.width * scale)),
    height: Math.max(1, Math.round(bitmap.height * scale)),
    baseName: "photo",
    fallbackType: "image/jpeg",
  });
}
