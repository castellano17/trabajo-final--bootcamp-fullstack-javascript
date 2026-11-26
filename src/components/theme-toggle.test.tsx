import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function renderThemeToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  return screen.getByRole("button", { name: "Cambiar tema" });
}

function isDarkThemeApplied() {
  return document.documentElement.classList.contains("dark");
}

describe("ThemeToggle", () => {
  it("switches from light to dark and back when clicked", async () => {
    const user = userEvent.setup();
    const toggleButton = renderThemeToggle();
    expect(isDarkThemeApplied()).toBe(false);

    await user.click(toggleButton);
    expect(isDarkThemeApplied()).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");

    await user.click(toggleButton);
    expect(isDarkThemeApplied()).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
