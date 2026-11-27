const internalBaseUrl = "http://internal.invalid";

export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next || !next.startsWith("/")) {
    return fallback;
  }

  const target = new URL(next, internalBaseUrl);
  if (target.origin !== internalBaseUrl) {
    return fallback;
  }

  return `${target.pathname}${target.search}${target.hash}`;
}
