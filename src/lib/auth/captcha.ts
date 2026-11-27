import { requirePublicEnv } from "@/lib/env";

export const captchaFieldName = "cf-turnstile-response";

export const turnstileSiteKey = requirePublicEnv(
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);
