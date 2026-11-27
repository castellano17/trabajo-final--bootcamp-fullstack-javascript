import type { Page } from "@playwright/test";

export async function trackCspViolations(page: Page) {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { cspViolations: violations });
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
}

export function readCspViolations(page: Page) {
  return page.evaluate(
    () => (window as unknown as { cspViolations: string[] }).cspViolations,
  );
}
