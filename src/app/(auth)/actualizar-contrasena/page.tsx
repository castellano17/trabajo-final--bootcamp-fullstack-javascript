import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordUpdateForm } from "@/components/auth/password-update-form";

export const metadata: Metadata = {
  title: "Nueva contraseña · ReseñIt",
};

export default function PasswordUpdatePage() {
  return (
    <AuthCard
      title="Elige una contraseña nueva"
      description="Después de guardarla seguirás con la sesión iniciada."
    >
      <PasswordUpdateForm />
    </AuthCard>
  );
}
