import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export const metadata: Metadata = {
  title: "Iniciar sesión · ReseñIt",
};

type SignInSearchParams = PageProps<"/iniciar-sesion">["searchParams"];

async function SignInContent({
  searchParams,
}: {
  searchParams: SignInSearchParams;
}) {
  const { next, error } = await searchParams;
  const nextPath = getSafeRedirectPath(typeof next === "string" ? next : null);

  return (
    <div className="grid gap-4">
      {error === "enlace-invalido" && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          El enlace no es válido o ya venció. Pide uno nuevo.
        </p>
      )}
      <SignInForm next={nextPath} />
    </div>
  );
}

export default function SignInPage({
  searchParams,
}: PageProps<"/iniciar-sesion">) {
  return (
    <AuthCard
      title="Inicia sesión"
      description="Entra para reseñar y comentar."
      footer={
        <>
          <Link
            href="/recuperar-contrasena"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <p>
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </>
      }
    >
      <Suspense>
        <SignInContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
