"use client";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { FormStatusMessage } from "@/components/auth/form-status-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { useAuthForm } from "@/components/auth/use-auth-form";
import { Button } from "@/components/ui/button";

export function PasswordResetRequestForm() {
  const { state, fieldErrors, handleSubmit, isPending, submissionCount } =
    useAuthForm(requestPasswordReset);

  if (state.status === "success") {
    return <FormStatusMessage state={state} />;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <FormField
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        required
        errors={fieldErrors.email}
      />
      <TurnstileField key={submissionCount} errors={fieldErrors.captchaToken} />
      <FormStatusMessage state={state} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
