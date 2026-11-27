"use client";

import { type ComponentProps, type ReactNode, useId } from "react";

import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

export type FormFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  errors?: string[];
  trailing?: ReactNode;
};

export function FormField({
  name,
  label,
  errors,
  trailing,
  ...inputProps
}: FormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hasErrors = Boolean(errors?.length);
  const controlProps = {
    id: fieldId,
    name,
    "aria-invalid": hasErrors,
    "aria-describedby": hasErrors ? errorId : undefined,
    ...inputProps,
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      {trailing ? (
        <InputGroup>
          <InputGroupInput {...controlProps} />
          <InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>
        </InputGroup>
      ) : (
        <Input {...controlProps} />
      )}
      {hasErrors && (
        <p id={errorId} className="text-sm text-destructive">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}
