"use client";

import { useFormStatus } from "react-dom";

import { SubmitButton } from "@/components/auth/submit-button";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <SubmitButton
      variant="ghost"
      size="sm"
      isPending={pending}
      pendingLabel="Cerrando sesión…"
    >
      Cerrar sesión
    </SubmitButton>
  );
}
