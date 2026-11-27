import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

import {
  accountNavigation,
  createConfirmedUser,
  submitSignIn,
} from "./support/auth";
import { readCspViolations, trackCspViolations } from "./support/csp";

const avatarFixture = path.join(__dirname, "fixtures", "avatar.png");
const avatarBucketPath =
  /\/storage\/v1\/object\/public\/avatars\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;
const unreadableImageMessage = "Elige una imagen JPEG, PNG o WebP.";

function headerAvatarImage(page: Page) {
  return accountNavigation(page).locator("img");
}

function avatarDialog(page: Page) {
  return page.getByRole("dialog", { name: "Cambiar foto" });
}

function dropZone(dialog: Locator) {
  return dialog.getByRole("button", {
    name: /Arrastra una imagen o haz clic para elegirla/,
  });
}

function imageToCrop(dialog: Locator) {
  return dialog.getByAltText("Imagen para recortar");
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

async function openAvatarDialog(page: Page) {
  await page.getByRole("button", { name: "Cambiar foto" }).click();
  const dialog = avatarDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

async function chooseImage(
  dialog: Locator,
  file: string | { name: string; mimeType: string; buffer: Buffer },
) {
  await dialog.locator('input[type="file"]:not([capture])').setInputFiles(file);
}

async function uploadAvatar(page: Page) {
  const previousSource = (await headerAvatarImage(page).count())
    ? await headerAvatarImage(page).getAttribute("src")
    : null;

  const dialog = await openAvatarDialog(page);
  await chooseImage(dialog, avatarFixture);
  await expect(imageToCrop(dialog)).toBeVisible();
  await dialog.getByRole("button", { name: "Guardar foto" }).click();
  await expect(dialog).toBeHidden();

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

test("choosing an image, zooming in and saving leaves a 512×512 avatar from the avatars bucket in the header", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-upload");

  const dialog = await openAvatarDialog(page);
  await expect(dropZone(dialog)).toBeVisible();
  await chooseImage(dialog, avatarFixture);
  await expect(imageToCrop(dialog)).toBeVisible();

  const zoomSlider = dialog.getByRole("slider", { name: "Zoom" });
  await expect(zoomSlider).toHaveAttribute("aria-valuemin", "1");
  await expect(zoomSlider).toHaveAttribute("aria-valuemax", "3");
  await zoomSlider.focus();
  for (let step = 0; step < 5; step += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await expect(zoomSlider).toHaveAttribute("aria-valuenow", "1.5");

  await dialog.getByRole("button", { name: "Guardar foto" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Guardamos tu foto.")).toBeVisible();
  const headerImage = headerAvatarImage(page);
  await expect(headerImage).toHaveAttribute("src", avatarBucketPath);
  await expect
    .poll(() =>
      headerImage.evaluate((image: HTMLImageElement) => [
        image.naturalWidth,
        image.naturalHeight,
      ]),
    )
    .toEqual([512, 512]);
});

test("dropping an image on the drop zone opens the crop step", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-drop");
  const dialog = await openAvatarDialog(page);

  const dataTransfer = await page.evaluateHandle((base64Image) => {
    const bytes = Uint8Array.from(atob(base64Image), (character) =>
      character.charCodeAt(0),
    );
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "avatar.png", { type: "image/png" }));
    return transfer;
  }, readFileSync(avatarFixture).toString("base64"));
  const zone = dropZone(dialog).locator("..");
  await zone.dispatchEvent("dragover", { dataTransfer });
  await zone.dispatchEvent("drop", { dataTransfer });

  await expect(imageToCrop(dialog)).toBeVisible();
});

test("choosing another image goes back to the choose step", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-another");
  const dialog = await openAvatarDialog(page);
  await chooseImage(dialog, avatarFixture);
  await expect(imageToCrop(dialog)).toBeVisible();

  await dialog.getByRole("button", { name: "Elegir otra" }).click();

  await expect(dropZone(dialog)).toBeVisible();
  await expect(imageToCrop(dialog)).toHaveCount(0);
});

test("cancelling closes the dialog without changing the avatar", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-cancel");
  const avatarSource = await uploadAvatar(page);
  const dialog = await openAvatarDialog(page);
  await chooseImage(dialog, avatarFixture);
  await expect(imageToCrop(dialog)).toBeVisible();

  await dialog.getByRole("button", { name: "Cancelar" }).click();

  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(headerAvatarImage(page)).toHaveAttribute("src", avatarSource);
});

test("an unreadable file shows the error inside the dialog and does not change the avatar", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-unreadable");
  const avatarSource = await uploadAvatar(page);
  const dialog = await openAvatarDialog(page);

  await chooseImage(dialog, {
    name: "foto.png",
    mimeType: "image/png",
    buffer: Buffer.from("<html><script>alert(1)</script></html>"),
  });

  await expect(dialog.getByRole("alert")).toHaveText(unreadableImageMessage);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(headerAvatarImage(page)).toHaveAttribute("src", avatarSource);
});

test("take photo only appears on touch devices, with the front camera capture", async ({
  page,
  request,
  browser,
}) => {
  await signInToProfile(page, request, "avatar-camera");
  const desktopDialog = await openAvatarDialog(page);
  await expect(
    desktopDialog.getByRole("button", { name: "Tomar foto" }),
  ).toHaveCount(0);

  const touchContext = await browser.newContext({
    hasTouch: true,
    baseURL: test.info().project.use.baseURL,
    storageState: await page.context().storageState(),
  });
  const touchPage = await touchContext.newPage();
  await touchPage.goto("/perfil");
  const touchDialog = await openAvatarDialog(touchPage);

  await expect(
    touchDialog.getByRole("button", { name: "Tomar foto" }),
  ).toBeVisible();
  await expect(
    touchDialog.locator('input[type="file"][capture="user"]'),
  ).toHaveCount(1);
  await touchContext.close();
});

test("the dialog works with the keyboard: focus stays inside, Enter opens the file chooser and Escape closes it", async ({
  page,
  request,
}) => {
  await signInToProfile(page, request, "avatar-keyboard");
  const dialog = await openAvatarDialog(page);
  await expect(dialog.locator(":focus")).toHaveCount(1);

  await dropZone(dialog).focus();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(avatarFixture);
  await expect(imageToCrop(dialog)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
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

test("the profile page with the dialog on the crop step runs without CSP violations", async ({
  page,
  request,
}) => {
  await trackCspViolations(page);
  await signInToProfile(page, request, "avatar-csp");
  const dialog = await openAvatarDialog(page);
  await chooseImage(dialog, avatarFixture);
  await expect(imageToCrop(dialog)).toBeVisible();
  await expect
    .poll(() =>
      imageToCrop(dialog).evaluate(
        (image: HTMLImageElement) => image.naturalWidth,
      ),
    )
    .toBeGreaterThan(0);

  expect(await readCspViolations(page)).toEqual([]);
});
