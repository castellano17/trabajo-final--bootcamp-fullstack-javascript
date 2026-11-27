import { expect, test, type Page } from "@playwright/test";

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

async function listedPlaceNames(page: Page, regionName?: string) {
  const scope = regionName
    ? page.getByRole("region", { name: regionName })
    : page.getByRole("main");
  return scope.getByRole("listitem").getByRole("heading").allTextContents();
}

test.describe("home page sections", () => {
  test("searching from the home leads to the filtered listing", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Buscar taquerías por nombre").fill("cocuyos");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();

    await expect(page).toHaveURL("/lugares?q=cocuyos");
    expect(await listedPlaceNames(page)).toEqual(["Taquería Los Cocuyos"]);
  });

  test("the photo mosaic loads its three photos from the site through next/image", async ({
    page,
  }) => {
    await page.goto("/");
    const photos = page
      .getByRole("main")
      .locator("section")
      .first()
      .locator("img");

    await expect(photos).toHaveCount(3);
    for (const photo of await photos.all()) {
      await expect
        .poll(() =>
          photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      expect(
        await photo.evaluate((image: HTMLImageElement) => image.currentSrc),
      ).toContain("/_next/image?url=%2Fimages%2F");
    }
  });

  test("the top rated section shows the first three places of the listing in the same order", async ({
    page,
  }) => {
    await page.goto("/");
    const topRatedNames = await listedPlaceNames(page, "Las mejor calificadas");

    await page.goto("/lugares");
    const listingNames = await listedPlaceNames(page);

    expect(topRatedNames).toHaveLength(3);
    expect(topRatedNames).toEqual(listingNames.slice(0, 3));
  });

  test("each category shortcut leads to the listing filtered by that category", async ({
    page,
  }) => {
    await page.goto("/");
    const categoryLinks = page
      .getByRole("region", { name: "Explora por categoría" })
      .getByRole("link");

    await expect(categoryLinks).toHaveCount(9);
    await categoryLinks.filter({ hasText: "Birria" }).click();

    await expect(page).toHaveURL("/lugares?categoria=birria");
  });

  test("the header stays at the top of the screen after scrolling", async ({
    page,
  }) => {
    await page.goto("/lugares");

    await page.mouse.wheel(0, 1500);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    const header = page.getByRole("banner");
    await expect(header).toBeInViewport();
    expect((await header.boundingBox())?.y).toBe(0);
  });

  for (const path of ["/", "/lugares", "/lugares/tacos-el-guero"]) {
    test(`the footer shows on ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole("contentinfo")).toContainText(
        "Trabajo final del Bootcamp Fullstack JavaScript",
      );
    });
  }
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu button opens the main links and leads to the listing", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Principal" }),
    ).toBeHidden();

    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("menuitem", { name: "Taquerías" }).click();

    await expect(page).toHaveURL("/lugares");
  });
});
