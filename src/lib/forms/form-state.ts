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

const invalidFieldsMessage = "Revisa los campos marcados.";

export function validationErrorState(error: z.ZodError): FormState {
  return {
    status: "error",
    message: invalidFieldsMessage,
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export function fieldErrorState(fieldName: string, message: string): FormState {
  return {
    status: "error",
    message: invalidFieldsMessage,
    fieldErrors: { [fieldName]: [message] },
  };
}

export function readFormField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
