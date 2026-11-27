import { expect, test, type Page } from "@playwright/test";

import { submitSignIn } from "./support/auth";
import { uniquePlaceName } from "./support/places";

const tacosElGueroId = "b0000000-0000-0000-0000-000000000001";
const tacosElGueroPath = "/lugares/tacos-el-guero";
const ownMapsUrl = "https://maps.app.goo.gl/AbCdEf123";
const invalidMapsUrlMessage = "Pega un enlace de Google Maps.";

function addressLink(page: Page, address: string) {
  return page.getByRole("link", { name: new RegExp(address) });
}

async function signInAsAdmin(page: Page, nextPath: string) {
  await submitSignIn(page, {
    email: "admin@resenit.test",
    password: "password123",
    path: `/iniciar-sesion?next=${encodeURIComponent(nextPath)}`,
  });
  await expect(page).toHaveURL(nextPath);
}

async function saveMapsUrl(page: Page, mapsUrl: string) {
  await page.getByRole("link", { name: "Editar", exact: true }).click();
  await page.getByLabel("Enlace de Google Maps (opcional)").fill(mapsUrl);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
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
    await signInAsAdmin(page, "/lugares/nuevo");
    await page.getByLabel("Nombre").fill(uniquePlaceName());
    await page.getByLabel("Categoría").selectOption("guisado");
    await page.getByLabel("Dirección").fill(address);
    await page.getByLabel("Enlace de Google Maps (opcional)").fill(ownMapsUrl);
    await page.getByRole("button", { name: "Crear lugar" }).click();
    await expect(page).toHaveURL(/\/lugares\/zz-prueba-[a-z0-9-]+$/);
    const placePath = new URL(page.url()).pathname;
    await expect(addressLink(page, address)).toHaveAttribute(
      "href",
      ownMapsUrl,
    );

    await saveMapsUrl(page, "https://otro-sitio.com/maps");
    await expect(page.getByText(invalidMapsUrlMessage)).toBeVisible();
    await expect(page).toHaveURL(`${placePath}/editar`);
    await page.goto(placePath);
    await expect(addressLink(page, address)).toHaveAttribute(
      "href",
      ownMapsUrl,
    );

    await saveMapsUrl(page, "");
    await expect(page).toHaveURL(placePath);
    await expect(addressLink(page, address)).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Calle+de+Prueba+9",
    );

    await page.getByRole("button", { name: "Borrar", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Borrar lugar" })
      .click();
    await expect(page).toHaveURL("/lugares");
  });
});

test.describe("place QR", () => {
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
});

test.describe("share dialog", () => {
  const shareDialogName = "Compartir Tacos El Güero";
  const shortUrl = "http://localhost:3100/lugares/tacos-el-guero";

  async function openShareDialog(page: Page) {
    await page.goto(tacosElGueroPath);
    await page.getByRole("button", { name: "Compartir" }).click();
    const dialog = page.getByRole("dialog", { name: shareDialogName });
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

  test("a visitor without a session sees Compartir, and the dialog shows the QR, the name and the short URL", async ({
    page,
  }) => {
    const dialog = await openShareDialog(page);

    await expect(dialog).toContainText(shortUrl);
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
      shortUrl,
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
          text: `Tacos El Güero en ReseñIt: ${shortUrl}`,
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

test.describe("link previews", () => {
  test("the place page declares the Open Graph title, description and URL with the slug", async ({
    page,
  }) => {
    const placeUrl = "http://localhost:3100/lugares/tacos-el-guero";

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
      placeUrl,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      placeUrl,
    );
  });
});
