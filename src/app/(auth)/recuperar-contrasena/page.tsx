import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña · ReseñIt",
};

export default function PasswordResetRequestPage() {
  return (
    <AuthCard
      title="Recupera tu contraseña"
      description="Te enviaremos un enlace para elegir una contraseña nueva."
      footer={
        <Link
          href="/iniciar-sesion"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      <PasswordResetRequestForm />
    </AuthCard>
  );
}
