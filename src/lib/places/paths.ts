export function placePath(slug: string): string {
  return `/lugares/${slug}`;
}

export function placeEditPath(slug: string): string {
  return `${placePath(slug)}/editar`;
}

export function placeReviewPath(slug: string): string {
  return `${placePath(slug)}/resena`;
}

export function placeQrPath(slug: string): string {
  return `${placePath(slug)}/qr`;
}

export function googleMapsUrl({
  mapsUrl,
  address,
}: {
  mapsUrl: string | null;
  address: string;
}): string {
  if (mapsUrl) {
    return mapsUrl;
  }
  const searchUrl = new URL("https://www.google.com/maps/search/");
  searchUrl.searchParams.set("api", "1");
  searchUrl.searchParams.set("query", address);
  return searchUrl.toString();
}
