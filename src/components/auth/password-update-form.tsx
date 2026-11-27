"use client";

import { updatePassword } from "@/app/(auth)/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";

export function PasswordUpdateForm() {
  const { state, fieldErrors, handleSubmit, isPending } =
    useFormAction(updatePassword);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <PasswordField
        name="password"
        label="Contraseña nueva"
        autoComplete="new-password"
        required
        errors={fieldErrors.password}
      />
      <PasswordField
        name="passwordConfirmation"
        label="Repite la contraseña"
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
