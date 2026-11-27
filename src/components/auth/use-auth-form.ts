"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";

import {
  type AuthFormState,
  initialAuthFormState,
} from "@/lib/auth/form-state";

type AuthAction = (
  previousState: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

export function useAuthForm(action: AuthAction) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialAuthFormState,
  );
  const [submissionCount, setSubmissionCount] = useState(0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmissionCount((count) => count + 1);
    startTransition(() => formAction(formData));
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return { state, fieldErrors, handleSubmit, isPending, submissionCount };
}
