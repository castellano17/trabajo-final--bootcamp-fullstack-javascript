"use client";

import { resendConfirmation } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { FormStatusMessage } from "@/components/auth/form-status-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { useAuthForm } from "@/components/auth/use-auth-form";

export function ResendConfirmationForm({
  defaultEmail,
}: {
  defaultEmail: string;
}) {
  const { state, fieldErrors, handleSubmit, isPending, submissionCount } =
    useAuthForm(resendConfirmation);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border p-4"
      aria-label="Reenviar confirmación"
      noValidate
    >
      <p className="text-sm text-muted-foreground">
        ¿No te llegó el correo de confirmación? Te lo volvemos a enviar.
      </p>
      <FormField
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        defaultValue={defaultEmail}
        required
        errors={fieldErrors.email}
      />
      <TurnstileField key={submissionCount} errors={fieldErrors.captchaToken} />
      <FormStatusMessage state={state} />
      <SubmitButton
        variant="secondary"
        isPending={isPending}
        pendingLabel="Enviando…"
      >
        Reenviar correo de confirmación
      </SubmitButton>
    </form>
  );
}
