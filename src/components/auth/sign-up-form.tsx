"use client";

import { signUp } from "@/app/(auth)/actions";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { FormField } from "@/components/forms/form-field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";

export function SignUpForm() {
  const { state, fieldErrors, handleSubmit, isPending, submissionCount } =
    useFormAction(signUp);

  if (state.status === "success") {
    return <FormStatusMessage state={state} />;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <FormField
        name="displayName"
        label="Nombre"
        autoComplete="nickname"
        maxLength={50}
        required
        errors={fieldErrors.displayName}
      />
      <FormField
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        required
        errors={fieldErrors.email}
      />
      <FormField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors.password}
      />
      <p className="text-xs text-muted-foreground">
        Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
      </p>
      <TurnstileField key={submissionCount} errors={fieldErrors.captchaToken} />
      <FormStatusMessage state={state} />
      <SubmitButton isPending={isPending} pendingLabel="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
