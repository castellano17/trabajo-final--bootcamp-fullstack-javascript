import { expect, test } from "@playwright/test";

const darkThemeClass = /\bdark\b/;

test.describe("home", () => {
  test.use({ colorScheme: "light" });

  test("shows the app name", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ReseñIt");
  });

  test("applies the dark class when the theme button is clicked", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(darkThemeClass);

    await page.getByRole("button", { name: "Cambiar tema" }).click();

    await expect(page.locator("html")).toHaveClass(darkThemeClass);
  });
});

test.describe("home with a dark system preference", () => {
  test.use({ colorScheme: "dark" });

  test("renders dark on first load before the app hydrates", async ({
    page,
  }) => {
    await page.route("**/_next/static/chunks/**", (route) => route.abort());

    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(darkThemeClass);
  });
});
