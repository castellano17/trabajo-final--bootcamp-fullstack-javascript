import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta · ReseñIt",
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Reseña taquerías y comparte tus favoritas."
      footer={
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/iniciar-sesion"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
