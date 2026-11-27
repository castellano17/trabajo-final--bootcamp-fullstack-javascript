import { expect, test, type Page } from "@playwright/test";

import { pageAlert, submitSignIn } from "./support/auth";
import { readCspViolations, trackCspViolations } from "./support/csp";
import { uniquePlaceName } from "./support/places";

const seedPassword = "password123";
const tacosElGueroPath = "/lugares/tacos-el-guero";
const carnitasPath = "/lugares/carnitas-michoacan";
const notFoundText = "No encontramos esta página";
const emptyFiltersText = "No encontramos taquerías con esos filtros.";

function placeCards(page: Page) {
  return page.getByRole("main").getByRole("listitem");
}

async function placeNames(page: Page) {
  return page
    .getByRole("main")
    .getByRole("listitem")
    .getByRole("heading")
    .allTextContents();
}

function placeManagementControls(page: Page) {
  return page
    .getByRole("link", { name: /^(Nuevo lugar|Editar)$/ })
    .or(page.getByRole("button", { name: "Borrar", exact: true }));
}

test.describe("places listing", () => {
  test("lists places by best average, then most reviews, then name", async ({
    page,
  }) => {
    await page.goto("/lugares");

    expect(await placeCards(page).count()).toBe(12);
    expect((await placeNames(page)).slice(0, 4)).toEqual([
      "Taquería Los Cocuyos",
      "Birria Don Pepe",
      "El Trompo de Oro",
      "Tacos El Güero",
    ]);
    await expect(placeCards(page).first()).toContainText("Otro");
    await expect(placeCards(page).first()).toContainText("Bolívar 56");
    await expect(placeCards(page).first()).toContainText("(1 reseña)");
  });

  test("choosing a category shows only places of that category", async ({
    page,
  }) => {
    await page.goto("/lugares");

    await page.getByLabel("Categoría").selectOption("canasta");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page).toHaveURL(/categoria=canasta/);
    await expect(placeCards(page)).not.toHaveCount(0);
    for (const card of await placeCards(page).all()) {
      await expect(card).toContainText("Canasta");
    }
  });

  test("searching by name ignores case and treats wildcards as text", async ({
    page,
  }) => {
    await page.goto("/lugares");
    await page.getByLabel("Buscar por nombre").fill("COCUYOS");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page).toHaveURL(/q=COCUYOS/);
    expect(await placeNames(page)).toEqual(["Taquería Los Cocuyos"]);

    for (const wildcard of ["%", "_", "*"]) {
      await page.goto(`/lugares?q=${encodeURIComponent(wildcard)}`);
      await expect(page.getByText(emptyFiltersText)).toBeVisible();
    }
  });

  test("the second page shows the places after the first twelve", async ({
    page,
  }) => {
    await page.goto("/lugares");
    const firstPageNames = await placeNames(page);

    await page
      .getByRole("navigation", { name: "Paginación" })
      .getByRole("link", { name: "Siguiente" })
      .click();

    await expect(page).toHaveURL(/pagina=2/);
    const secondPageNames = await placeNames(page);
    expect(secondPageNames.length).toBeGreaterThan(0);
    expect(
      secondPageNames.filter((name) => firstPageNames.includes(name)),
    ).toEqual([]);
  });

  test("an invalid category or page in the URL is ignored", async ({
    page,
  }) => {
    const response = await page.goto("/lugares?categoria=sushi&pagina=abc");

    expect(response?.status()).toBe(200);
    expect(await placeCards(page).count()).toBe(12);
  });

  test("the home button and the header link lead to the places listing", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Explorar taquerías" }).click();
    await expect(page).toHaveURL("/lugares");

    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Taquerías" })
      .click();
    await expect(page).toHaveURL("/lugares");
  });
});

test.describe("place page", () => {
  test("shows the place details and its visible reviews", async ({ page }) => {
    await page.goto(tacosElGueroPath);

    await expect(
      page.getByRole("heading", { level: 1, name: "Tacos El Güero" }),
    ).toBeVisible();
    await expect(page.getByText("Av. Insurgentes Sur 1234")).toBeVisible();
    await expect(
      page.getByText("Tacos al pastor con piña asada al trompo."),
    ).toBeVisible();
    const firstReview = page.getByRole("article").filter({
      hasText: "El mejor pastor que he probado",
    });
    await expect(firstReview).toContainText("Usuaria Demo");
    await expect(
      firstReview.getByRole("img", { name: /de 5 estrellas/ }),
    ).toBeVisible();
    await expect(firstReview.locator("time")).toBeVisible();
  });

  test("a hidden review never shows, not even to a moderator, and an empty place says it has no reviews", async ({
    page,
  }) => {
    await submitSignIn(page, {
      email: "moderator@resenit.test",
      password: seedPassword,
      path: `/iniciar-sesion?next=${carnitasPath}`,
    });
    await expect(page).toHaveURL(carnitasPath);

    await expect(page.getByText("Todavía no hay reseñas.")).toBeVisible();
    await expect(
      page.getByText("Las carnitas estaban secas esta vez."),
    ).toHaveCount(0);
  });

  for (const invalidPath of [
    "/lugares/no-existe",
    "/lugares/00000000-0000-0000-0000-000000000000",
  ]) {
    test(`${invalidPath} shows the not found page`, async ({ page }) => {
      const response = await page.goto(invalidPath);

      expect(response?.status()).toBe(404);
      await expect(page.getByText(notFoundText)).toBeVisible();
    });
  }
});

test.describe("rating summary and security", () => {
  async function ratingRows(page: Page) {
    return page
      .getByRole("list", { name: "Calificaciones por puntaje" })
      .getByRole("listitem")
      .evaluateAll((rows) =>
        rows.map((row) => {
          const bar = row.querySelector('[role="progressbar"]');
          return {
            label: bar?.getAttribute("aria-label"),
            percentage: bar?.getAttribute("aria-valuenow"),
            count: row.lastElementChild?.textContent,
          };
        }),
      );
  }

  test("the rating summary counts the visible reviews of each score", async ({
    page,
  }) => {
    await page.goto(tacosElGueroPath);

    await expect(
      page.getByRole("complementary", { name: "Resumen de calificaciones" }),
    ).toContainText("4.5");
    expect(await ratingRows(page)).toEqual([
      { label: "5 estrellas", percentage: "50", count: "1" },
      { label: "4 estrellas", percentage: "50", count: "1" },
      { label: "3 estrellas", percentage: "0", count: "0" },
      { label: "2 estrellas", percentage: "0", count: "0" },
      { label: "1 estrella", percentage: "0", count: "0" },
    ]);
  });

  test("a place without visible reviews shows every score at zero", async ({
    page,
  }) => {
    await page.goto(carnitasPath);

    const rows = await ratingRows(page);
    expect(rows).toHaveLength(5);
    expect(
      rows.every((row) => row.count === "0" && row.percentage === "0"),
    ).toBe(true);
  });

  test("the listing and a place page run without CSP violations", async ({
    page,
  }) => {
    await trackCspViolations(page);

    await page.goto("/lugares");
    await expect(placeCards(page).first()).toBeVisible();
    expect(await readCspViolations(page)).toEqual([]);

    await page.goto(tacosElGueroPath);
    await expect(page.getByRole("article").first()).toBeVisible();
    expect(await readCspViolations(page)).toEqual([]);
  });
});

test.describe("place management", () => {
  test("a visitor without a session is sent to sign in from the new place form", async ({
    page,
  }) => {
    await page.goto("/lugares");
    await expect(placeManagementControls(page)).toHaveCount(0);

    await page.goto("/lugares/nuevo");

    await expect(page).toHaveURL("/iniciar-sesion?next=%2Flugares%2Fnuevo");
  });

  test("a regular user sees no management buttons and the admin forms are not found", async ({
    page,
  }) => {
    await submitSignIn(page, {
      email: "user@resenit.test",
      password: seedPassword,
      path: "/iniciar-sesion?next=/lugares",
    });
    await expect(page).toHaveURL("/lugares");
    await expect(placeManagementControls(page)).toHaveCount(0);
    await page.goto(tacosElGueroPath);
    await expect(placeManagementControls(page)).toHaveCount(0);

    for (const adminPath of ["/lugares/nuevo", `${tacosElGueroPath}/editar`]) {
      const response = await page.goto(adminPath);
      expect(response?.status()).toBe(404);
      await expect(page.getByText(notFoundText)).toBeVisible();
    }
  });

  test("the admin creates, edits and deletes a place", async ({ page }) => {
    const placeName = uniquePlaceName();
    await submitSignIn(page, {
      email: "admin@resenit.test",
      password: seedPassword,
      path: "/iniciar-sesion?next=/lugares",
    });
    await expect(page).toHaveURL("/lugares");

    await page.getByRole("link", { name: "Nuevo lugar" }).click();
    await page.getByRole("button", { name: "Crear lugar" }).click();
    await expect(page.getByText("Ingresa el nombre.")).toBeVisible();
    await expect(page.getByText("Ingresa la dirección.")).toBeVisible();
    await expect(page).toHaveURL("/lugares/nuevo");

    await page.getByLabel("Nombre").fill(placeName);
    await page.getByLabel("Categoría").selectOption("guisado");
    await page.getByLabel("Dirección").fill("Calle de Prueba 1");
    await page.getByLabel("Descripción").fill("Creado por el test e2e.");
    await page.getByRole("button", { name: "Crear lugar" }).click();
    await expect(page).toHaveURL(/\/lugares\/zz-prueba-[a-z0-9-]+$/);
    const placePath = new URL(page.url()).pathname;
    await expect(
      page.getByRole("heading", { level: 1, name: placeName }),
    ).toBeVisible();
    await page.goto(`/lugares?q=${encodeURIComponent(placeName)}`);
    expect(await placeNames(page)).toEqual([placeName]);

    await page.goto(placePath);
    await page.getByRole("link", { name: "Editar" }).click();
    await page.getByLabel("Dirección").fill("Calle Editada 2");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL(placePath);
    await expect(page.getByText("Calle Editada 2")).toBeVisible();

    await page.getByRole("button", { name: "Borrar" }).click();
    const deleteDialog = page.getByRole("alertdialog");
    await expect(deleteDialog).toContainText(
      "Se borrarán el lugar y 0 reseñas.",
    );
    await deleteDialog.getByRole("button", { name: "Cancelar" }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: placeName }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Borrar" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Borrar lugar" })
      .click();
    await expect(page).toHaveURL("/lugares");
    await expect(pageAlert(page)).toHaveCount(0);
    const deletedResponse = await page.goto(placePath);
    expect(deletedResponse?.status()).toBe(404);
  });
});
