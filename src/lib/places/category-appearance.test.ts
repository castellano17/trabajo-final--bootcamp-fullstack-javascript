import { describe, expect, it } from "vitest";

import { placeCategories } from "@/lib/places/categories";
import { categoryAppearance } from "@/lib/places/category-appearance";

describe("categoryAppearance", () => {
  it("gives every category an icon and a theme color for its tile and icon", () => {
    for (const category of placeCategories) {
      const appearance = categoryAppearance[category];

      expect(appearance.icon).toBeTruthy();
      expect(appearance.tileClassName).toMatch(/^bg-chart-[1-5]\/\d+$/);
      expect(appearance.iconClassName).toMatch(/^text-chart-[1-5]$/);
    }
  });
});
