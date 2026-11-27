import { expect, test, type Page } from "@playwright/test";

async function trackCspViolations(page: Page) {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { cspViolations: violations });
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
}

function readCspViolations(page: Page) {
  return page.evaluate(
    () => (window as unknown as { cspViolations: string[] }).cspViolations,
  );
}

test("responses include the security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toMatch(
    /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
  );
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("every response gets a fresh nonce", async ({ request }) => {
  const nonceOf = async () =>
    (await request.get("/"))
      .headers()
      ["content-security-policy"].match(/'nonce-([^']+)'/)?.[1];

  expect(await nonceOf()).not.toBe(await nonceOf());
});

test("the home, the theme toggle and the captcha run without CSP violations", async ({
  page,
}) => {
  await trackCspViolations(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Cambiar tema" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  expect(await readCspViolations(page)).toEqual([]);

  await page.goto("/registro");
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(
    /.+/,
    {
      timeout: 15_000,
    },
  );
  expect(await readCspViolations(page)).toEqual([]);
});
