import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { latestEmailLinkTo } from "./mailpit";

export const validPassword = "Secreta123";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
}

export async function waitForCaptcha(page: Page) {
  const captchaInputs = page.locator('input[name="cf-turnstile-response"]');
  await expect(captchaInputs.first()).toHaveValue(/.+/, { timeout: 15_000 });
  for (const input of await captchaInputs.all()) {
    await expect(input).toHaveValue(/.+/, { timeout: 15_000 });
  }
}

export function pageAlert(page: Page) {
  return page.getByRole("main").getByRole("alert");
}

export function accountNavigation(page: Page) {
  return page.getByRole("navigation", { name: "Cuenta" });
}

export async function submitSignUp(
  page: Page,
  {
    displayName,
    email,
    password,
  }: { displayName: string; email: string; password: string },
) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(displayName);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await waitForCaptcha(page);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

export async function submitSignIn(
  page: Page,
  {
    email,
    password,
    path = "/iniciar-sesion",
  }: { email: string; password: string; path?: string },
) {
  await page.goto(path);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await waitForCaptcha(page);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    accountNavigation(page).getByRole("link", { name: "Iniciar sesión" }),
  ).toBeVisible();
}

export async function createConfirmedUser(
  page: Page,
  request: APIRequestContext,
  prefix: string,
) {
  const account = {
    displayName: `Usuario ${prefix}`,
    email: uniqueEmail(prefix),
    password: validPassword,
  };
  await submitSignUp(page, account);
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestEmailLinkTo(request, account.email));
  await expect(accountNavigation(page)).toContainText(account.displayName);
  await signOut(page);
  return account;
}
