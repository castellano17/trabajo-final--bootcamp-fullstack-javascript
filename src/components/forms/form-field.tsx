"use client";

import type { ComponentProps, ReactNode } from "react";

import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
  return (
    <Field label={label} errors={errors}>
      {(controlProps) =>
        trailing ? (
          <InputGroup>
            <InputGroupInput {...controlProps} name={name} {...inputProps} />
            <InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>
          </InputGroup>
        ) : (
          <Input {...controlProps} name={name} {...inputProps} />
        )
      }
    </Field>
  );
}
