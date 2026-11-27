import path from "node:path";

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import {
  accountNavigation,
  createConfirmedUser,
  pageAlert,
  submitSignIn,
} from "./support/auth";
import { readCspViolations, trackCspViolations } from "./support/csp";

const avatarFixture = path.join(__dirname, "fixtures", "avatar.png");
const avatarBucketPath =
  /\/storage\/v1\/object\/public\/avatars\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;

function headerAvatarImage(page: Page) {
  return accountNavigation(page).locator("img");
}

async function signInToProfile(
  page: Page,
  request: APIRequestContext,
  prefix: string,
) {
  const account = await createConfirmedUser(page, request, prefix);
  await submitSignIn(page, {
    ...account,
    path: "/iniciar-sesion?next=/perfil",
  });
  await expect(page).toHaveURL("/perfil");
  return account;
}

async function uploadAvatar(page: Page) {
  const previousSource = (await headerAvatarImage(page).count())
    ? await headerAvatarImage(page).getAttribute("src")
    : null;

  await page.getByLabel("Elige una foto").setInputFiles(avatarFixture);
  await expect(
    page.getByAltText("Vista previa de tu nueva foto"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar foto" }).click();

  const headerImage = headerAvatarImage(page);
  await expect(headerImage).toHaveAttribute("src", avatarBucketPath);
  if (previousSource) {
    await expect(headerImage).not.toHaveAttribute("src", previousSource);
  }
  await expect
    .poll(() =>
      headerImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  return (await headerImage.getAttribute("src")) ?? "";
}

test("/perfil without a session redirects to sign in", async ({ page }) => {
  await page.goto("/perfil");

  await expect(page).toHaveURL("/iniciar-sesion?next=%2Fperfil");
});

test("changing the name saves it and the header shows the new name", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "rename");

  await page.getByLabel("Nombre", { exact: true }).fill("Taquero Mayor");
  await page.getByRole("button", { name: "Guardar nombre" }).click();

  await expect(accountNavigation(page)).toContainText("Taquero Mayor");
});

test("an empty name shows the field error and is not saved", async ({
  page,
  request,
}) => {
  const account = await signInToProfile(page, request, "empty-name");

  await page.getByLabel("Nombre", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "Guardar nombre" }).click();

  await expect(page.getByText("Ingresa tu nombre.")).toBeVisible();
  await page.reload();
  await expect(accountNavigation(page)).toContainText(account.displayName);
});

test("uploading a photo crops it to 512×512 and the header shows it from the avatars bucket", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-upload");

  await uploadAvatar(page);

  const dimensions = await headerAvatarImage(page).evaluate(
    (image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight],
  );
  expect(dimensions).toEqual([512, 512]);
});

test("replacing the avatar deletes the previous file", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-replace");
  const firstSource = await uploadAvatar(page);

  const secondSource = await uploadAvatar(page);

  expect(secondSource).not.toBe(firstSource);
  expect((await request.get(firstSource)).ok()).toBe(false);
});

test("removing the avatar deletes the file and the header shows the initials again", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-remove");
  const avatarSource = await uploadAvatar(page);

  await page.getByRole("button", { name: "Quitar foto" }).click();

  await expect(page.getByText("Quitamos tu foto.")).toBeVisible();
  await expect(headerAvatarImage(page)).toHaveCount(0);
  await expect(accountNavigation(page)).toContainText("UA");
  expect((await request.get(avatarSource)).ok()).toBe(false);
});

test("a file that is not an image is rejected and the avatar does not change", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-fake");
  const avatarSource = await uploadAvatar(page);

  await page.getByLabel("Elige una foto").setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: Buffer.from("<html><script>alert(1)</script></html>"),
  });
  await page.getByRole("button", { name: "Guardar foto" }).click();

  await expect(pageAlert(page)).toHaveText(
    "Elige una imagen JPEG, PNG o WebP.",
  );
  await page.reload();
  await expect(headerAvatarImage(page)).toHaveAttribute("src", avatarSource);
});

test("the profile page with an avatar runs without CSP violations", async ({
  page,
  request,
}) => {
  await trackCspViolations(page);
  await signInToProfile(page, request, "avatar-csp");
  await uploadAvatar(page);

  await page.reload();
  await expect
    .poll(() =>
      headerAvatarImage(page).evaluate(
        (image: HTMLImageElement) => image.naturalWidth,
      ),
    )
    .toBeGreaterThan(0);

  expect(await readCspViolations(page)).toEqual([]);
});
