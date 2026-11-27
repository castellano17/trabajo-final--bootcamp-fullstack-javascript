"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";

import { type FormState, initialFormState } from "@/lib/forms/form-state";

type FormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

export function useFormAction(action: FormAction) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialFormState,
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
