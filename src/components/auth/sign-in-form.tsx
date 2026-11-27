"use client";

import { useState } from "react";

import { signIn } from "@/app/(auth)/actions";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { FormField } from "@/components/forms/form-field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const { state, fieldErrors, handleSubmit, isPending, submissionCount } =
    useFormAction(signIn);
  const needsConfirmation =
    state.status === "error" && state.code === "email_not_confirmed";

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <FormField
          name="email"
          label="Correo"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          errors={fieldErrors.email}
        />
        <PasswordField
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          errors={fieldErrors.password}
        />
        <TurnstileField
          key={submissionCount}
          errors={fieldErrors.captchaToken}
        />
        <FormStatusMessage state={state} />
        <SubmitButton isPending={isPending} pendingLabel="Iniciando sesión…">
          Iniciar sesión
        </SubmitButton>
      </form>
      {needsConfirmation && <ResendConfirmationForm defaultEmail={email} />}
    </div>
  );
}
