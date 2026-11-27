import { supabaseUrl } from "@/lib/supabase/config";

const turnstileOrigin = "https://challenges.cloudflare.com";

export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function buildContentSecurityPolicy(nonce: string): string {
  const supabaseOrigin = new URL(supabaseUrl).origin;
  const supabaseRealtimeOrigin = supabaseOrigin.replace(/^http/, "ws");
  const developmentScriptSources =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${turnstileOrigin}${developmentScriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabaseOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin} ${supabaseRealtimeOrigin}`,
    `frame-src ${turnstileOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
