import { expect, test } from "@playwright/test";

const tacosElGueroId = "b0000000-0000-0000-0000-000000000001";
const tacosElGueroPath = "/lugares/tacos-el-guero";

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
