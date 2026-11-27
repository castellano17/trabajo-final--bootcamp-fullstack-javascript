import QRCode from "qrcode";

import {
  placeQrMarginInModules,
  placeQrSizeInPixels,
} from "@/lib/places/config";
import { placeUrl } from "@/lib/places/paths";
import { getPlaceBySlug } from "@/lib/places/queries";
import { placeSlugSchema } from "@/lib/places/schemas";
import { siteOriginFor } from "@/lib/site-origin";

const oneDayInSeconds = 86400;

export async function GET(
  request: Request,
  { params }: RouteContext<"/lugares/[slug]/qr">,
) {
  const { slug } = await params;
  const place = placeSlugSchema.safeParse(slug).success
    ? await getPlaceBySlug(slug)
    : null;
  if (!place) {
    return new Response(null, { status: 404 });
  }

  const qrImage = await QRCode.toBuffer(
    placeUrl(siteOriginFor(new URL(request.url).origin), place.slug),
    {
      type: "png",
      width: placeQrSizeInPixels,
      margin: placeQrMarginInModules,
      color: { dark: "#000000", light: "#ffffff" },
    },
  );

  return new Response(new Uint8Array(qrImage), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${place.slug}.png"`,
      "Cache-Control": `public, max-age=${oneDayInSeconds}`,
    },
  });
}
