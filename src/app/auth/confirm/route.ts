import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supportedLinkTypes = [
  "email",
  "recovery",
] as const satisfies readonly EmailOtpType[];

type SupportedLinkType = (typeof supportedLinkTypes)[number];

function isSupportedLinkType(value: string | null): value is SupportedLinkType {
  return supportedLinkTypes.some((linkType) => linkType === value);
}

function redirectToInvalidLink(request: NextRequest, reason: string) {
  logger.warn("auth.confirm.failed", { reason });
  return NextResponse.redirect(
    new URL("/iniciar-sesion?error=enlace-invalido", request.url),
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const linkType = searchParams.get("type");

  if (!tokenHash || !isSupportedLinkType(linkType)) {
    return redirectToInvalidLink(request, "malformed_link");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type: linkType,
    token_hash: tokenHash,
  });
  if (error) {
    return redirectToInvalidLink(request, error.code ?? "verification_failed");
  }

  logger.info(
    linkType === "email"
      ? "auth.sign_up.confirmed"
      : "auth.password_reset.verified",
    {
      userId: data.user?.id,
    },
  );
  const nextPath = getSafeRedirectPath(searchParams.get("next"));
  return NextResponse.redirect(new URL(nextPath, request.url));
}
