import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmitButton } from "@/components/auth/submit-button";

describe("SubmitButton", () => {
  it("is disabled and shows the pending label while the action runs, so it cannot be submitted twice", () => {
    const { rerender } = render(
      <SubmitButton isPending pendingLabel="Iniciando sesión…">
        Iniciar sesión
      </SubmitButton>,
    );
    expect(
      screen.getByRole("button", { name: "Iniciando sesión…" }),
    ).toHaveProperty("disabled", true);

    rerender(
      <SubmitButton isPending={false} pendingLabel="Iniciando sesión…">
        Iniciar sesión
      </SubmitButton>,
    );
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toHaveProperty("disabled", false);
  });
});
