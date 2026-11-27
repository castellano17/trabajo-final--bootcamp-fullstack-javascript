import { headers } from "next/headers";

type SiteOriginSources = {
  vercelEnvironment: string | undefined;
  productionHost: string | undefined;
  requestOrigin: string;
};

export function resolveSiteOrigin({
  vercelEnvironment,
  productionHost,
  requestOrigin,
}: SiteOriginSources): string {
  return vercelEnvironment === "production" && productionHost
    ? `https://${productionHost}`
    : requestOrigin;
}

export function siteOriginFor(requestOrigin: string): string {
  return resolveSiteOrigin({
    vercelEnvironment: process.env.VERCEL_ENV,
    productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    requestOrigin,
  });
}

export async function currentRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("origin") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`
  );
}

export async function currentSiteOrigin(): Promise<string> {
  return siteOriginFor(await currentRequestOrigin());
}
