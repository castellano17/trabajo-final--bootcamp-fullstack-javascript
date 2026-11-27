"use client";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { FormField } from "@/components/forms/form-field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";

export function PasswordResetRequestForm() {
  const { state, fieldErrors, handleSubmit, isPending, submissionCount } =
    useFormAction(requestPasswordReset);

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
      <SubmitButton isPending={isPending} pendingLabel="Enviando…">
        Enviar enlace
      </SubmitButton>
    </form>
  );
}
