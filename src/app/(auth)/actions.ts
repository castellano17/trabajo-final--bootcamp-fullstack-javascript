"use server";

import { redirect } from "next/navigation";

import { captchaFieldName } from "@/lib/auth/captcha";
import { getConfirmUrl } from "@/lib/auth/confirm-url";
import { authErrorMessage, isUserFacingAuthError } from "@/lib/auth/errors";
import {
  type AuthFormState,
  checkInboxMessage,
  readFormField,
  validationErrorState,
} from "@/lib/auth/form-state";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  resendConfirmationSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseStatelessClient } from "@/lib/supabase/stateless";

export async function signUp(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    displayName: readFormField(formData, "displayName"),
    email: readFormField(formData, "email"),
    password: readFormField(formData, "password"),
    captchaToken: readFormField(formData, captchaFieldName),
  });
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const supabase = createSupabaseStatelessClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      captchaToken: parsed.data.captchaToken,
      emailRedirectTo: await getConfirmUrl(),
    },
  });

  if (error && error.code !== "user_already_exists") {
    logger.warn("auth.sign_up.failed", { reason: error.code });
    return { status: "error", message: authErrorMessage(error.code) };
  }

  logger.info("auth.sign_up.requested");
  return { status: "success", message: checkInboxMessage };
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: readFormField(formData, "email"),
    password: readFormField(formData, "password"),
    captchaToken: readFormField(formData, captchaFieldName),
  });
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { captchaToken: parsed.data.captchaToken },
  });

  if (error) {
    logger.warn("auth.sign_in.failed", { reason: error.code });
    return signInErrorState(error.code);
  }

  logger.info("auth.sign_in.succeeded", { userId: data.user.id });
  redirect(getSafeRedirectPath(readFormField(formData, "next")));
}

function signInErrorState(errorCode: string | undefined): AuthFormState {
  if (errorCode === "email_not_confirmed") {
    return {
      status: "error",
      code: "email_not_confirmed",
      message: "Confirma tu correo antes de iniciar sesión.",
    };
  }
  if (errorCode === "invalid_credentials") {
    return { status: "error", message: "Email o contraseña incorrectos." };
  }
  return { status: "error", message: authErrorMessage(errorCode) };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  await supabase.auth.signOut();
  logger.info("auth.sign_out", { userId: data?.claims.sub });
  redirect("/");
}

export async function resendConfirmation(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resendConfirmationSchema.safeParse({
    email: readFormField(formData, "email"),
    captchaToken: readFormField(formData, captchaFieldName),
  });
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const supabase = createSupabaseStatelessClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      captchaToken: parsed.data.captchaToken,
      emailRedirectTo: await getConfirmUrl(),
    },
  });

  if (error && isUserFacingAuthError(error.code)) {
    logger.warn("auth.confirmation.resend_failed", { reason: error.code });
    return { status: "error", message: authErrorMessage(error.code) };
  }

  logger.info("auth.confirmation.resent");
  return { status: "success", message: checkInboxMessage };
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: readFormField(formData, "email"),
    captchaToken: readFormField(formData, captchaFieldName),
  });
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const supabase = createSupabaseStatelessClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      captchaToken: parsed.data.captchaToken,
      redirectTo: await getConfirmUrl(),
    },
  );

  if (error && isUserFacingAuthError(error.code)) {
    logger.warn("auth.password_reset.failed", { reason: error.code });
    return { status: "error", message: authErrorMessage(error.code) };
  }

  logger.info("auth.password_reset.requested");
  return { status: "success", message: checkInboxMessage };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) {
    redirect("/iniciar-sesion?next=/actualizar-contrasena");
  }

  const parsed = passwordUpdateSchema.safeParse({
    password: readFormField(formData, "password"),
    passwordConfirmation: readFormField(formData, "passwordConfirmation"),
  });
  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    logger.warn("auth.password.update_failed", { userId, reason: error.code });
    return { status: "error", message: authErrorMessage(error.code) };
  }

  logger.info("auth.password.updated", { userId });
  redirect("/");
}
