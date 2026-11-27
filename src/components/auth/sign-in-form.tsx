"use client";

import { useState } from "react";

import { signIn } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { FormStatusMessage } from "@/components/auth/form-status-message";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { useAuthForm } from "@/components/auth/use-auth-form";
import { Button } from "@/components/ui/button";

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const { state, fieldErrors, handleSubmit, isPending, submissionCount } =
    useAuthForm(signIn);
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
        <FormField
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          errors={fieldErrors.password}
        />
        <TurnstileField
          key={submissionCount}
          errors={fieldErrors.captchaToken}
        />
        <FormStatusMessage state={state} />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
      </form>
      {needsConfirmation && <ResendConfirmationForm defaultEmail={email} />}
    </div>
  );
}
