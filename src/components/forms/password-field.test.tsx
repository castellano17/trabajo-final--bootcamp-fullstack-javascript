import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { PasswordField } from "@/components/forms/password-field";

describe("PasswordField", () => {
  it("toggles between hiding and showing the password, renames its button and never submits the form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={handleSubmit}>
        <PasswordField name="password" label="Contraseña" />
      </form>,
    );
    const passwordInput = screen.getByLabelText("Contraseña");
    expect(passwordInput).toHaveProperty("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Mostrar contraseña" }),
    );
    expect(passwordInput).toHaveProperty("type", "text");

    await user.click(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    );
    expect(passwordInput).toHaveProperty("type", "password");
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
