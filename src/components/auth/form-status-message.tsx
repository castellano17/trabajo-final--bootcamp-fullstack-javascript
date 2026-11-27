import type { AuthFormState } from "@/lib/auth/form-state";

export function FormStatusMessage({ state }: { state: AuthFormState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "error") {
    return (
      <p
        role="alert"
        className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {state.message}
      </p>
    );
  }

  return (
    <p
      role="status"
      className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground"
    >
      {state.message}
    </p>
  );
}
