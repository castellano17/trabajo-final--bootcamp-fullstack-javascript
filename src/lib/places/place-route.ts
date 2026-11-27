import { notFound, permanentRedirect } from "next/navigation";

import {
  getPlaceBySlug,
  getPlaceSlug,
  type PlaceDetail,
} from "@/lib/places/queries";
import { placeIdSchema, placeSlugSchema } from "@/lib/places/schemas";

export async function findPlaceForRoute(
  routeParam: string,
  pathOf: (slug: string) => string,
): Promise<PlaceDetail> {
  if (placeIdSchema.safeParse(routeParam).success) {
    const slug = await getPlaceSlug(routeParam);
    if (!slug) {
      notFound();
    }
    permanentRedirect(pathOf(slug));
  }

  const place = placeSlugSchema.safeParse(routeParam).success
    ? await getPlaceBySlug(routeParam)
    : null;
  if (!place) {
    notFound();
  }
  return place;
}
