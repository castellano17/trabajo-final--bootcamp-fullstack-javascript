"use client";

import { updatePassword } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { FormStatusMessage } from "@/components/auth/form-status-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useAuthForm } from "@/components/auth/use-auth-form";

export function PasswordUpdateForm() {
  const { state, fieldErrors, handleSubmit, isPending } =
    useAuthForm(updatePassword);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <FormField
        name="password"
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors.password}
      />
      <FormField
        name="passwordConfirmation"
        label="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors.passwordConfirmation}
      />
      <p className="text-xs text-muted-foreground">
        Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
      </p>
      <FormStatusMessage state={state} />
      <SubmitButton isPending={isPending} pendingLabel="Guardando…">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}
