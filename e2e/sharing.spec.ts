import { expect, test, type Page } from "@playwright/test";

import { signInAs } from "./support/auth";
import { readCspViolations, trackCspViolations } from "./support/csp";
import { uniquePlaceName } from "./support/places";
import { chooseRating, reviewPhotoFixture } from "./support/reviews";

const tacosElGueroId = "b0000000-0000-0000-0000-000000000001";
const tacosElGueroPath = "/lugares/tacos-el-guero";
const tacosElGueroUrl = "http://localhost:3100/lugares/tacos-el-guero";
const adminEmail = "admin@resenit.test";
const userEmail = "user@resenit.test";
const ownMapsUrl = "https://maps.app.goo.gl/AbCdEf123";
const invalidMapsUrlMessage = "Pega un enlace de Google Maps.";

function addressLink(page: Page, address: string) {
  return page.getByRole("link", { name: new RegExp(address) });
}

async function createPlaceAsAdmin(
  page: Page,
  { address, mapsUrl = "" }: { address: string; mapsUrl?: string },
) {
  await signInAs(page, adminEmail, "/lugares/nuevo");
  await page.getByLabel("Nombre").fill(uniquePlaceName());
  await page.getByLabel("Categoría").selectOption("guisado");
  await page.getByLabel("Dirección").fill(address);
  await page.getByLabel("Enlace de Google Maps (opcional)").fill(mapsUrl);
  await page.getByRole("button", { name: "Crear lugar" }).click();
  await expect(page).toHaveURL(/\/lugares\/zz-prueba-[a-z0-9-]+$/);
  return new URL(page.url()).pathname;
}

async function editPlace(page: Page, fieldLabel: string, value: string) {
  await page.getByRole("link", { name: "Editar", exact: true }).click();
  await page.getByLabel(fieldLabel).fill(value);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
}

async function deletePlaceAsAdmin(page: Page) {
  await page.getByRole("button", { name: "Borrar", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Borrar lugar" })
    .click();
  await expect(page).toHaveURL("/lugares");
}

async function openShareDialog(page: Page) {
  await page.goto(tacosElGueroPath);
  await page.getByRole("button", { name: "Compartir" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Compartir Tacos El Güero",
  });
  const qrImage = dialog.getByRole("img", {
    name: "Código QR de Tacos El Güero",
  });
  await expect
    .poll(() =>
      qrImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  return dialog;
}

test.describe("place URLs", () => {
  for (const subpage of ["", "/resena", "/editar"]) {
    test(`an old /lugares/<uuid>${subpage} link redirects permanently to the same page with the slug`, async ({
      request,
    }) => {
      const response = await request.get(
        `/lugares/${tacosElGueroId}${subpage}`,
        { maxRedirects: 0 },
      );

      expect(response.status()).toBe(308);
      expect(
        new URL(response.headers().location, "http://localhost").pathname,
      ).toBe(`${tacosElGueroPath}${subpage}`);
    });
  }

  test("every place opens at /lugares/<slug>", async ({ page }) => {
    const response = await page.goto(tacosElGueroPath);

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Tacos El Güero" }),
    ).toBeVisible();
  });

  test("after the admin renames a place, its URL and its QR stay the same", async ({
    page,
  }) => {
    const placePath = await createPlaceAsAdmin(page, {
      address: "Calle de Prueba 10",
    });
    const newName = uniquePlaceName();

    await editPlace(page, "Nombre", newName);

    await expect(page).toHaveURL(placePath);
    await expect(
      page.getByRole("heading", { level: 1, name: newName }),
    ).toBeVisible();
    expect((await page.request.get(`${placePath}/qr`)).status()).toBe(200);
    await deletePlaceAsAdmin(page);
  });

  test("the cards of the listing and the home link to slug URLs", async ({
    page,
  }) => {
    for (const path of ["/", "/lugares"]) {
      await page.goto(path);
      const placeLinks = page
        .getByRole("main")
        .getByRole("link")
        .filter({ has: page.getByRole("heading") });
      await expect(placeLinks.first()).toBeVisible();
      for (const href of await placeLinks.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )) {
        expect(href).toMatch(/^\/lugares\/[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });
});

test.describe("share dialog", () => {
  test("the QR of a place is a PNG image and a place that does not exist has no QR", async ({
    request,
  }) => {
    const response = await request.get(`${tacosElGueroPath}/qr`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect((await response.body()).subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );
    expect((await request.get("/lugares/no-existe/qr")).status()).toBe(404);
  });

  test("a visitor without a session sees Compartir, and the dialog shows the QR, the name and the short URL", async ({
    page,
  }) => {
    const dialog = await openShareDialog(page);

    await expect(dialog).toContainText(tacosElGueroUrl);
  });

  test("Descargar QR downloads a PNG named qr-<slug>.png", async ({ page }) => {
    const dialog = await openShareDialog(page);

    const downloadEvent = page.waitForEvent("download");
    await dialog.getByRole("link", { name: "Descargar QR" }).click();

    expect((await downloadEvent).suggestedFilename()).toBe(
      "qr-tacos-el-guero.png",
    );
  });

  test("Copiar enlace copies the short URL and says it was copied", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const dialog = await openShareDialog(page);

    await dialog.getByRole("button", { name: "Copiar enlace" }).click();

    await expect(dialog.getByRole("status")).toHaveText("Enlace copiado.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      tacosElGueroUrl,
    );
  });

  test("Compartir sends the QR image and the link to the system share menu", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const sharedItems: { text?: string; fileNames: string[] }[] = [];
      Object.assign(window, { sharedItems });
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: () => true,
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: ShareData) => {
          sharedItems.push({
            text: data.text,
            fileNames: (data.files ?? []).map((file) => file.name),
          });
        },
      });
    });
    const dialog = await openShareDialog(page);

    await dialog.getByRole("button", { name: "Compartir" }).click();

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as unknown as {
                sharedItems: { text?: string; fileNames: string[] }[];
              }
            ).sharedItems,
        ),
      )
      .toEqual([
        {
          text: `Tacos El Güero en ReseñIt: ${tacosElGueroUrl}`,
          fileNames: ["qr-tacos-el-guero.png"],
        },
      ]);
  });

  test("in a browser that cannot share, the dialog has no Compartir button", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: undefined,
      });
    });
    const dialog = await openShareDialog(page);

    await expect(dialog.getByRole("button", { name: "Compartir" })).toHaveCount(
      0,
    );
    await expect(
      dialog.getByRole("button", { name: "Copiar enlace" }),
    ).toBeVisible();
  });
});

test.describe("Google Maps link", () => {
  test("without its own link, the address opens a Google Maps search of that address in a new tab", async ({
    page,
  }) => {
    await page.goto(tacosElGueroPath);

    const link = addressLink(page, "Av. Insurgentes Sur 1234");
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Av.+Insurgentes+Sur+1234%2C+Ciudad+de+M%C3%A9xico",
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("the address opens the link the admin saved, an invalid link is rejected and an empty field removes it", async ({
    page,
  }) => {
    const address = "Calle de Prueba 9";
    const placePath = await createPlaceAsAdmin(page, {
      address,
      mapsUrl: ownMapsUrl,
    });
    await expect(addressLink(page, address)).toHaveAttribute(
      "href",
      ownMapsUrl,
    );

    await editPlace(
      page,
      "Enlace de Google Maps (opcional)",
      "https://otro-sitio.com/maps",
    );
    await expect(page.getByText(invalidMapsUrlMessage)).toBeVisible();
    await expect(page).toHaveURL(`${placePath}/editar`);
    await page.goto(placePath);
    await expect(addressLink(page, address)).toHaveAttribute(
      "href",
      ownMapsUrl,
    );

    await editPlace(page, "Enlace de Google Maps (opcional)", "");
    await expect(page).toHaveURL(placePath);
    await expect(addressLink(page, address)).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Calle+de+Prueba+9",
    );
    await deletePlaceAsAdmin(page);
  });
});

test.describe("deleting a place", () => {
  test("deleting a place with a review with a photo removes the photo file from the bucket", async ({
    page,
    browser,
  }) => {
    const placePath = await createPlaceAsAdmin(page, {
      address: "Calle de Prueba 11",
    });
    const authorPage = await browser.newPage();
    await signInAs(authorPage, userEmail, `${placePath}/resena`);
    await chooseRating(authorPage, "1 estrella");
    await authorPage
      .getByLabel("Tu reseña")
      .fill("Zz reseña de prueba con foto.");
    await authorPage
      .getByLabel("Elegir fotos")
      .setInputFiles(reviewPhotoFixture);
    await expect(authorPage.getByAltText("Foto 1 de tu reseña")).toBeVisible();
    await authorPage.getByRole("button", { name: "Publicar reseña" }).click();
    await expect(authorPage).toHaveURL(placePath);
    const photo = authorPage
      .getByRole("list", { name: /^Fotos de la reseña de / })
      .getByRole("img");
    await expect(photo).toBeVisible();
    const photoUrl = (await photo.getAttribute("src")) ?? "";
    expect((await authorPage.request.get(photoUrl)).ok()).toBe(true);
    await authorPage.close();

    await page.reload();
    await deletePlaceAsAdmin(page);

    expect((await page.request.get(photoUrl)).ok()).toBe(false);
  });
});

test.describe("quality", () => {
  test("the place page with the share dialog open runs without CSP violations", async ({
    page,
  }) => {
    await trackCspViolations(page);

    await openShareDialog(page);

    expect(await readCspViolations(page)).toEqual([]);
  });

  test("the place page declares the Open Graph title, description and URL with the slug", async ({
    page,
  }) => {
    await page.goto(tacosElGueroPath);

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Tacos El Güero",
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", "Tacos al pastor con piña asada al trompo.");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      tacosElGueroUrl,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      tacosElGueroUrl,
    );
  });
});
