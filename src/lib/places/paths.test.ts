import { describe, expect, it } from "vitest";

import {
  googleMapsUrl,
  placeEditPath,
  placePath,
  placeQrPath,
  placeReviewPath,
} from "@/lib/places/paths";

describe("place paths", () => {
  it("every place page lives under /lugares/<slug>", () => {
    expect(placePath("tacos-el-guero")).toBe("/lugares/tacos-el-guero");
    expect(placeEditPath("tacos-el-guero")).toBe(
      "/lugares/tacos-el-guero/editar",
    );
    expect(placeReviewPath("tacos-el-guero")).toBe(
      "/lugares/tacos-el-guero/resena",
    );
    expect(placeQrPath("tacos-el-guero")).toBe("/lugares/tacos-el-guero/qr");
  });
});

describe("googleMapsUrl", () => {
  it("when the place has a Google Maps link, the address opens that link", () => {
    expect(
      googleMapsUrl({
        mapsUrl: "https://maps.app.goo.gl/AbCdEf123",
        address: "Av. Insurgentes Sur 1234",
      }),
    ).toBe("https://maps.app.goo.gl/AbCdEf123");
  });

  it("when the place has no link, the address opens a Google Maps search of that address", () => {
    const searchUrl = new URL(
      googleMapsUrl({ mapsUrl: null, address: "Calle Doña Lupe #5 & Juárez" }),
    );

    expect(searchUrl.origin + searchUrl.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
    expect(searchUrl.searchParams.get("api")).toBe("1");
    expect(searchUrl.searchParams.get("query")).toBe(
      "Calle Doña Lupe #5 & Juárez",
    );
  });
});
