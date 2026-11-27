import path from "node:path";

import { expect, type Page } from "@playwright/test";

export const reviewPhotoFixture = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "images",
  "tacos-con-limon.webp",
);

export async function chooseRating(page: Page, starCount: string) {
  const ratingRadio = page.getByRole("radio", { name: starCount });
  await page.locator("label").filter({ has: ratingRadio }).click();
  await expect(ratingRadio).toBeChecked();
}
