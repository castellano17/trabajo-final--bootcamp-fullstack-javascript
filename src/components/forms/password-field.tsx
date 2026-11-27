"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { FormField, type FormFieldProps } from "@/components/forms/form-field";
import { InputGroupButton } from "@/components/ui/input-group";

type PasswordFieldProps = Omit<FormFieldProps, "type" | "trailing">;

export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormField
      {...props}
      type={isVisible ? "text" : "password"}
      trailing={
        <InputGroupButton
          size="icon-xs"
          className="text-muted-foreground"
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" />
          ) : (
            <Eye aria-hidden="true" />
          )}
          <span className="sr-only">
            {isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          </span>
        </InputGroupButton>
      }
    />
  );
}
