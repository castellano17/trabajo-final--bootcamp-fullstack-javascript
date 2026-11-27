"use client";

import { type ReactNode, useId } from "react";

import { Label } from "@/components/ui/label";

export type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FieldProps = {
  label: string;
  errors?: string[];
  children: (controlProps: FieldControlProps) => ReactNode;
};

export function Field({ label, errors, children }: FieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      {children({
        id: fieldId,
        "aria-invalid": hasErrors,
        "aria-describedby": hasErrors ? errorId : undefined,
      })}
      {hasErrors && (
        <p id={errorId} className="text-sm text-destructive">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}
