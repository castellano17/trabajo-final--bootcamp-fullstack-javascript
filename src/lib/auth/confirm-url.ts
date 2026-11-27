import { headers } from "next/headers";

export async function getConfirmUrl(): Promise<string> {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;
  return `${origin}/auth/confirm`;
}
