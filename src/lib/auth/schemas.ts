import { z } from "zod";

import { displayNameField } from "@/lib/profile/schemas";

const emailField = z
  .string()
  .trim()
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email("Ingresa un correo válido."));

const captchaTokenField = z
  .string()
  .min(1, "Completa la verificación de seguridad.");

const newPasswordField = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede superar los 72 caracteres.")
  .regex(/[a-z]/, "Incluye al menos una letra minúscula.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayúscula.")
  .regex(/\d/, "Incluye al menos un número.");

export const signUpSchema = z.object({
  displayName: displayNameField,
  email: emailField,
  password: newPasswordField,
  captchaToken: captchaTokenField,
});

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Ingresa tu contraseña."),
  captchaToken: captchaTokenField,
});

export const passwordResetRequestSchema = z.object({
  email: emailField,
  captchaToken: captchaTokenField,
});

export const resendConfirmationSchema = z.object({
  email: emailField,
  captchaToken: captchaTokenField,
});

export const passwordUpdateSchema = z
  .object({
    password: newPasswordField,
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirmation"],
  });
