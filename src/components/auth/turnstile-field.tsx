"use client";

import { Turnstile } from "@marsidev/react-turnstile";

import { captchaFieldName, turnstileSiteKey } from "@/lib/auth/captcha";

export function TurnstileField({ errors }: { errors?: string[] }) {
  return (
    <div className="grid gap-2">
      <Turnstile
        siteKey={turnstileSiteKey}
        options={{
          language: "es",
          theme: "auto",
          size: "flexible",
          responseFieldName: captchaFieldName,
        }}
      />
      {errors?.length ? (
        <p className="text-sm text-destructive">{errors[0]}</p>
      ) : null}
    </div>
  );
}
