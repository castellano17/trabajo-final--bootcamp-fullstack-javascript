import { expect, test } from "@playwright/test";

import {
  accountNavigation,
  pageAlert,
  createConfirmedUser,
  signOut,
  submitSignIn,
  submitSignUp,
  uniqueEmail,
  validPassword,
  waitForCaptcha,
} from "./support/auth";
import {
  countEmailsTo,
  latestEmailLinkTo,
  waitForEmailCount,
} from "./support/mailpit";

const checkInboxText = "Revisa tu correo";
const invalidCredentialsText = "Email o contraseña incorrectos.";

test.describe("sign up", () => {
  test("a valid sign-up asks to check the inbox and the confirmation link signs the user in", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("signup");

    await submitSignUp(page, {
      displayName: "Ana Tacos",
      email,
      password: validPassword,
    });
    await expect(page.getByRole("status")).toContainText(checkInboxText);

    await page.goto(await latestEmailLinkTo(request, email));
    await expect(page).toHaveURL("/");
    await expect(accountNavigation(page)).toContainText("Ana Tacos");
  });

  test("a weak password shows a field error and creates no account", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("weak");

    await submitSignUp(page, {
      displayName: "Débil",
      email,
      password: "password",
    });

    await expect(
      page.getByText("Incluye al menos una letra mayúscula."),
    ).toBeVisible();
    await page.waitForTimeout(1_500);
    expect(await countEmailsTo(request, email)).toBe(0);
  });

  test("signing up with a registered email shows the same message", async ({
    page,
    request,
  }) => {
    const account = await createConfirmedUser(page, request, "duplicate");

    await submitSignUp(page, { ...account, displayName: "Otra persona" });

    await expect(page.getByRole("status")).toContainText(checkInboxText);
  });
});

test.describe("sign in and sign out", () => {
  test("a wrong password and an unknown email show the same message", async ({
    page,
    request,
  }) => {
    const account = await createConfirmedUser(page, request, "enumeration");

    await submitSignIn(page, {
      email: account.email,
      password: "Equivocada123",
    });
    await expect(pageAlert(page)).toHaveText(invalidCredentialsText);

    await submitSignIn(page, {
      email: uniqueEmail("unknown"),
      password: "Equivocada123",
    });
    await expect(pageAlert(page)).toHaveText(invalidCredentialsText);
  });

  test("an internal next path is honored after signing in", async ({
    page,
    request,
  }) => {
    const account = await createConfirmedUser(page, request, "next");

    await submitSignIn(page, {
      ...account,
      path: "/iniciar-sesion?next=/recuperar-contrasena",
    });

    await expect(page).toHaveURL("/recuperar-contrasena");
  });

  for (const externalNext of ["https://externo.com", "//externo.com"]) {
    test(`an external next (${externalNext}) sends the user home`, async ({
      page,
      request,
    }) => {
      const account = await createConfirmedUser(page, request, "external");

      await submitSignIn(page, {
        ...account,
        path: `/iniciar-sesion?next=${encodeURIComponent(externalNext)}`,
      });

      await expect(page).toHaveURL("/");
    });
  }

  test("signing out shows the sign-in links and the session does not come back on reload", async ({
    page,
    request,
  }) => {
    const account = await createConfirmedUser(page, request, "signout");
    await submitSignIn(page, account);
    await expect(accountNavigation(page)).toContainText(account.displayName);

    await signOut(page);
    await page.reload();

    await expect(
      accountNavigation(page).getByRole("link", { name: "Registrarse" }),
    ).toBeVisible();
  });
});

test.describe("email confirmation", () => {
  test("an unconfirmed email offers to resend the confirmation and a new email arrives", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("unconfirmed");
    await submitSignUp(page, {
      displayName: "Sin confirmar",
      email,
      password: validPassword,
    });
    await waitForEmailCount(request, email, 1);

    await submitSignIn(page, { email, password: validPassword });
    const resendForm = page.getByRole("form", {
      name: "Reenviar confirmación",
    });
    await expect(resendForm).toBeVisible();
    await waitForCaptcha(page);
    await resendForm
      .getByRole("button", { name: "Reenviar correo de confirmación" })
      .click();

    await expect(resendForm.getByRole("status")).toContainText(checkInboxText);
    await waitForEmailCount(request, email, 2);
  });

  test("resending to an unknown email shows the same message", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("resend");
    await submitSignUp(page, {
      displayName: "Reenvío",
      email,
      password: validPassword,
    });
    await waitForEmailCount(request, email, 1);
    await submitSignIn(page, { email, password: validPassword });
    const resendForm = page.getByRole("form", {
      name: "Reenviar confirmación",
    });

    await waitForCaptcha(page);
    await resendForm
      .getByRole("button", { name: "Reenviar correo de confirmación" })
      .click();
    const knownEmailMessage = await resendForm
      .getByRole("status")
      .textContent();

    const unknownEmail = uniqueEmail("unknown-resend");
    await resendForm.getByLabel("Correo").fill(unknownEmail);
    await waitForCaptcha(page);
    await resendForm
      .getByRole("button", { name: "Reenviar correo de confirmación" })
      .click();
    await expect(resendForm.getByRole("status")).toBeVisible();

    expect(await resendForm.getByRole("status").textContent()).toBe(
      knownEmailMessage,
    );
    expect(await countEmailsTo(request, unknownEmail)).toBe(0);
  });

  test("an invalid confirmation link shows an error on the sign-in page", async ({
    page,
  }) => {
    await page.goto("/auth/confirm?token_hash=invalido&type=email&next=/");

    await expect(page).toHaveURL("/iniciar-sesion?error=enlace-invalido");
    await expect(pageAlert(page)).toContainText(
      "El enlace no es válido o ya venció",
    );
  });
});

test.describe("password recovery", () => {
  test("the recovery link lets the user set a new password and the old one stops working", async ({
    page,
    request,
  }) => {
    const account = await createConfirmedUser(page, request, "recovery");
    const newPassword = "NuevaClave456";

    await page.goto("/recuperar-contrasena");
    await page.getByLabel("Correo").fill(account.email);
    await waitForCaptcha(page);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("status")).toContainText(checkInboxText);
    await waitForEmailCount(request, account.email, 2);

    await page.goto(await latestEmailLinkTo(request, account.email));
    await expect(page).toHaveURL("/actualizar-contrasena");
    await page.getByLabel("Contraseña nueva").fill(newPassword);
    await page.getByLabel("Repite la contraseña").fill(newPassword);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page).toHaveURL("/");
    await signOut(page);

    await submitSignIn(page, account);
    await expect(pageAlert(page)).toHaveText(invalidCredentialsText);

    await submitSignIn(page, { email: account.email, password: newPassword });
    await expect(accountNavigation(page)).toContainText(account.displayName);
  });

  test("requesting recovery for an unknown email shows the same message and sends nothing", async ({
    page,
    request,
  }) => {
    const unknownEmail = uniqueEmail("unknown-recovery");

    await page.goto("/recuperar-contrasena");
    await page.getByLabel("Correo").fill(unknownEmail);
    await waitForCaptcha(page);
    await page.getByRole("button", { name: "Enviar enlace" }).click();

    await expect(page.getByRole("status")).toContainText(checkInboxText);
    await page.waitForTimeout(1_500);
    expect(await countEmailsTo(request, unknownEmail)).toBe(0);
  });

  test("the update password page without a session redirects to sign in", async ({
    page,
  }) => {
    await page.goto("/actualizar-contrasena");

    await expect(page).toHaveURL(
      "/iniciar-sesion?next=%2Factualizar-contrasena",
    );
  });
});
