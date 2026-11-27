"use client";

import { updateDisplayName } from "@/app/perfil/actions";
import { FormField } from "@/components/forms/form-field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { useFormAction } from "@/components/forms/use-form-action";

export function DisplayNameForm({ displayName }: { displayName: string }) {
  const { state, fieldErrors, handleSubmit, isPending } =
    useFormAction(updateDisplayName);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
      aria-label="Cambiar nombre"
      noValidate
    >
      <FormField
        name="displayName"
        label="Nombre"
        autoComplete="nickname"
        maxLength={50}
        defaultValue={displayName}
        required
        errors={fieldErrors.displayName}
      />
      <FormStatusMessage state={state} />
      <SubmitButton isPending={isPending} pendingLabel="Guardando…">
        Guardar nombre
      </SubmitButton>
    </form>
  );
}
