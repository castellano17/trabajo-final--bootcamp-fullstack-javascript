import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { submitSignIn } from "./support/auth";
import { readCspViolations, trackCspViolations } from "./support/csp";
import { uniquePlaceName } from "./support/places";

const seedPassword = "password123";
const userEmail = "user@resenit.test";
const moderatorEmail = "moderator@resenit.test";
const adminEmail = "admin@resenit.test";
const moderatorId = "a0000000-0000-0000-0000-000000000002";
const moderatorName = "Moderador Demo";
const moderatorReviewBody = "Zz reseña de prueba: tortillas tibias.";
const duplicateReviewMessage = "Ya escribiste una reseña de este lugar.";
const photoFixture = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "tacos-con-limon.webp",
);
const moderatorPhotoUrl = new RegExp(
  `/storage/v1/object/public/review-photos/${moderatorId}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.webp$`,
);

const placeName = uniquePlaceName();
let placePath = "";
let reviewPath = "";

async function signIn(page: Page, email: string, nextPath: string) {
  await submitSignIn(page, {
    email,
    password: seedPassword,
    path: `/iniciar-sesion?next=${encodeURIComponent(nextPath)}`,
  });
  await expect(page).toHaveURL(nextPath);
}

async function chooseRating(page: Page, starCount: string) {
  const ratingRadio = page.getByRole("radio", { name: starCount });
  await page.locator("label").filter({ has: ratingRadio }).click();
  await expect(ratingRadio).toBeChecked();
}

function photoInput(page: Page) {
  return page.getByLabel("Elegir fotos");
}

function photoFixtureCopies(count: number) {
  const buffer = readFileSync(photoFixture);
  return Array.from({ length: count }, (_, index) => ({
    name: `foto-${index + 1}.webp`,
    mimeType: "image/webp",
    buffer,
  }));
}

function moderatorReview(page: Page) {
  return page.getByRole("article").filter({ hasText: moderatorReviewBody });
}

function moderatorThumbnail(page: Page) {
  return moderatorReview(page)
    .getByRole("list", { name: `Fotos de la reseña de ${moderatorName}` })
    .getByRole("img");
}

async function moderatorPhotoUrlOnPlacePage(page: Page) {
  const photoUrl = await moderatorThumbnail(page).getAttribute("src");
  expect(photoUrl).toMatch(moderatorPhotoUrl);
  return photoUrl ?? "";
}

async function expectPhotoRemovedFromBucket(page: Page, photoUrl: string) {
  const response = await page.request.get(photoUrl);
  expect(response.ok()).toBe(false);
}

async function expectRatingSummary(
  page: Page,
  { rating, reviewCount }: { rating: string; reviewCount: string },
) {
  await page.goto(`/lugares?q=${encodeURIComponent(placeName)}`);
  const placeCard = page.getByRole("main").getByRole("listitem");
  await expect(placeCard).toHaveCount(1);
  await expect(placeCard).toContainText(rating);
  await expect(placeCard).toContainText(`(${reviewCount})`);

  await page.goto(placePath);
  const ratingSummary = page.getByRole("complementary", {
    name: "Resumen de calificaciones",
  });
  await expect(ratingSummary).toContainText(rating);
  await expect(ratingSummary).toContainText(reviewCount);
}

async function publishOutcome(tab: Page) {
  const duplicateMessage = tab.getByText(duplicateReviewMessage);
  const reviewsHeading = tab.getByRole("heading", {
    level: 2,
    name: "Reseñas",
    exact: true,
  });
  await expect(duplicateMessage.or(reviewsHeading)).toBeVisible();
  return (await duplicateMessage.isVisible()) ? "duplicate" : "published";
}

test.describe("reviews", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const adminPage = await browser.newPage();
    await signIn(adminPage, adminEmail, "/lugares/nuevo");
    await adminPage.getByLabel("Nombre").fill(placeName);
    await adminPage.getByLabel("Categoría").selectOption("guisado");
    await adminPage.getByLabel("Dirección").fill("Calle de Prueba 8");
    await adminPage.getByRole("button", { name: "Crear lugar" }).click();
    await expect(adminPage).toHaveURL(/\/lugares\/[0-9a-f-]{36}$/);
    placePath = new URL(adminPage.url()).pathname;
    reviewPath = `${placePath}/resena`;
    await adminPage.close();
  });

  test.afterAll(async ({ browser }) => {
    const adminPage = await browser.newPage();
    await signIn(adminPage, adminEmail, placePath);
    await adminPage
      .getByRole("button", { name: "Borrar", exact: true })
      .click();
    await adminPage
      .getByRole("alertdialog")
      .getByRole("button", { name: "Borrar lugar" })
      .click();
    await expect(adminPage).toHaveURL("/lugares");
    await adminPage.close();
  });

  test("when two tabs publish at once only one review is kept and the other tab is told it already exists", async ({
    page,
    context,
  }) => {
    await signIn(page, userEmail, reviewPath);
    const secondTab = await context.newPage();
    await secondTab.goto(reviewPath);

    for (const tab of [page, secondTab]) {
      await chooseRating(tab, "1 estrella");
      await tab
        .getByLabel("Tu reseña")
        .fill("Zz reseña de prueba en dos pestañas.");
    }
    await Promise.all(
      [page, secondTab].map((tab) =>
        tab.getByRole("button", { name: "Publicar reseña" }).click(),
      ),
    );

    const outcomes = await Promise.all([page, secondTab].map(publishOutcome));
    expect([...outcomes].sort()).toEqual(["duplicate", "published"]);
    await page.goto(placePath);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Editar tu reseña" }),
    ).toBeVisible();
  });

  test("a visitor who taps write a review signs in and comes back to the review form", async ({
    page,
  }) => {
    await page.goto(placePath);
    await page.getByRole("link", { name: "Escribir reseña" }).click();
    await expect(page).toHaveURL(
      `/iniciar-sesion?next=${encodeURIComponent(reviewPath)}`,
    );

    await submitSignIn(page, {
      email: moderatorEmail,
      password: seedPassword,
      path: page.url(),
    });

    await expect(page).toHaveURL(reviewPath);
    await expect(
      page.getByRole("heading", { level: 1, name: "Escribir reseña" }),
    ).toBeVisible();
  });

  test("publishing with a photo shows its thumbnail and updates the average and count in the listing", async ({
    page,
  }) => {
    await expectRatingSummary(page, { rating: "1.0", reviewCount: "1 reseña" });
    await signIn(page, moderatorEmail, reviewPath);

    await chooseRating(page, "2 estrellas");
    await page.getByLabel("Tu reseña").fill(moderatorReviewBody);
    await photoInput(page).setInputFiles(photoFixture);
    await expect(page.getByAltText("Foto 1 de tu reseña")).toBeVisible();
    await page.getByRole("button", { name: "Publicar reseña" }).click();

    await expect(page).toHaveURL(placePath);
    await expect(moderatorThumbnail(page)).toHaveCount(1);
    await moderatorPhotoUrlOnPlacePage(page);
    const thumbnailLabel = `Foto 1 de la reseña de ${moderatorName}`;
    await page.getByRole("button", { name: thumbnailLabel }).click();
    await expect(
      page.getByRole("dialog", { name: thumbnailLabel }).getByRole("img"),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expectRatingSummary(page, {
      rating: "1.5",
      reviewCount: "2 reseñas",
    });
  });

  test("editing removes a photo from the card and the bucket and changes the rating", async ({
    page,
  }) => {
    await signIn(page, moderatorEmail, placePath);
    const removedPhotoUrl = await moderatorPhotoUrlOnPlacePage(page);

    await page.getByRole("link", { name: "Editar tu reseña" }).click();
    await expect(page).toHaveURL(reviewPath);
    await expect(
      page.getByRole("radio", { name: "2 estrellas" }),
    ).toBeChecked();
    await expect(page.getByLabel("Tu reseña")).toHaveValue(moderatorReviewBody);
    await page.getByRole("button", { name: "Quitar foto 1" }).click();
    await photoInput(page).setInputFiles(photoFixture);
    await expect(page.getByAltText("Foto 1 de tu reseña")).toBeVisible();
    await chooseRating(page, "1 estrella");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page).toHaveURL(placePath);
    await expect(
      moderatorReview(page).getByRole("img", { name: "1.0 de 5 estrellas" }),
    ).toBeVisible();
    await expect(moderatorThumbnail(page)).toHaveCount(1);
    expect(await moderatorPhotoUrlOnPlacePage(page)).not.toBe(removedPhotoUrl);
    await expectPhotoRemovedFromBucket(page, removedPhotoUrl);
    await expectRatingSummary(page, {
      rating: "1.0",
      reviewCount: "2 reseñas",
    });
  });

  test("the form rejects a missing rating, an empty text, a fourth photo and a file that is not an image", async ({
    page,
  }) => {
    await signIn(page, adminEmail, reviewPath);
    const publishButton = page.getByRole("button", { name: "Publicar reseña" });

    await page.getByLabel("Tu reseña").fill("Zz reseña de prueba sin puntaje.");
    await publishButton.click();
    await expect(page.getByText("Elige un puntaje.")).toBeVisible();

    await chooseRating(page, "1 estrella");
    await page.getByLabel("Tu reseña").fill("   ");
    await publishButton.click();
    await expect(page.getByText("Escribe tu reseña.")).toBeVisible();

    await photoInput(page).setInputFiles(photoFixtureCopies(4));
    await expect(
      page.getByRole("alert").filter({
        hasText: "Una reseña puede tener hasta 3 fotos.",
      }),
    ).toBeVisible();

    await photoInput(page).setInputFiles({
      name: "notas.png",
      mimeType: "image/png",
      buffer: Buffer.from("esto no es una imagen"),
    });
    await expect(
      page.getByText("No pudimos leer esta foto. Prueba con JPEG, PNG o WebP."),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Fotos de la reseña", exact: true }),
    ).toHaveCount(0);
    await expect(page).toHaveURL(reviewPath);

    await page.goto(placePath);
    await expect(
      page.getByRole("link", { name: "Escribir reseña" }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);
  });

  test("deleting from the place page asks for confirmation and removes the review, its photo and its rating", async ({
    page,
  }) => {
    await signIn(page, moderatorEmail, placePath);
    const photoUrl = await moderatorPhotoUrlOnPlacePage(page);

    await page.getByRole("button", { name: "Borrar tu reseña" }).click();
    const deleteDialog = page.getByRole("alertdialog", {
      name: "¿Borrar tu reseña?",
    });
    await deleteDialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(moderatorReview(page)).toHaveCount(1);
    await page.getByRole("button", { name: "Borrar tu reseña" }).click();
    await deleteDialog.getByRole("button", { name: "Borrar reseña" }).click();

    await expect(moderatorReview(page)).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Escribir reseña" }),
    ).toBeVisible();
    await expectPhotoRemovedFromBucket(page, photoUrl);
    await expectRatingSummary(page, { rating: "1.0", reviewCount: "1 reseña" });
  });

  test("the review form runs without CSP violations, photo preview included", async ({
    page,
  }) => {
    await trackCspViolations(page);
    await signIn(page, userEmail, reviewPath);

    await photoInput(page).setInputFiles(photoFixture);
    await expect(page.getByAltText("Foto 1 de tu reseña")).toBeVisible();

    expect(await readCspViolations(page)).toEqual([]);
  });
});

test.describe("review page edge cases", () => {
  test("the review form of a place that does not exist shows the not found page", async ({
    page,
  }) => {
    const response = await page.goto(
      "/lugares/00000000-0000-0000-0000-000000000000/resena",
    );

    expect(response?.status()).toBe(404);
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
  });

  test("the author of a hidden review sees the notice and no write review button", async ({
    page,
  }) => {
    const carnitasPath = "/lugares/b0000000-0000-0000-0000-000000000004";
    await signIn(page, userEmail, carnitasPath);

    await expect(
      page.getByText("Un moderador ocultó tu reseña."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Editar tu reseña" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Escribir reseña" }),
    ).toHaveCount(0);
  });
});
