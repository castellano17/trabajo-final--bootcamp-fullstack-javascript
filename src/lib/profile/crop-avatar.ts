import type { Area } from "react-easy-crop";

import { renderBitmapAsImageFile } from "@/lib/images/resize-image";
import { avatarDimensionInPixels } from "@/lib/profile/avatar-config";

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

  return renderBitmapAsImageFile(bitmap, {
    width: avatarDimensionInPixels,
    height: avatarDimensionInPixels,
    baseName: "avatar",
    fallbackType: "image/png",
  });
}
