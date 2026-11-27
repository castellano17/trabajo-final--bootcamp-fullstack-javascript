import { z } from "zod";

export type FormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
      code?: string;
    }
  | { status: "success"; message: string };

export const initialFormState: FormState = { status: "idle" };

export function validationErrorState(error: z.ZodError): FormState {
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
