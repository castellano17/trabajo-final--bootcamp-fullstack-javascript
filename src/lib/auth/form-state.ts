import { z } from "zod";

export type AuthFormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
      code?: "email_not_confirmed";
    }
  | { status: "success"; message: string };

export const initialAuthFormState: AuthFormState = { status: "idle" };

export const checkInboxMessage =
  "Revisa tu correo. Si los datos son correctos, te enviamos un enlace para continuar.";

export function validationErrorState(error: z.ZodError): AuthFormState {
  return {
    status: "error",
    message: "Revisa los campos marcados.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export function readFormField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
