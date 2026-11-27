import { describe, expect, it } from "vitest";

import { resolveSiteOrigin } from "@/lib/site-origin";

const productionHost = "trabajo-final-bootcamp-fullstack-ja.vercel.app";

describe("resolveSiteOrigin", () => {
  it("in production the QR uses the main domain, even when the request arrives through a deployment URL", () => {
    expect(
      resolveSiteOrigin({
        vercelEnvironment: "production",
        productionHost,
        requestOrigin:
          "https://trabajo-final-abc123-castellano17s-projects.vercel.app",
      }),
    ).toBe(`https://${productionHost}`);
  });

  it("outside production the QR uses the origin of the request", () => {
    for (const vercelEnvironment of ["preview", "development", undefined]) {
      expect(
        resolveSiteOrigin({
          vercelEnvironment,
          productionHost,
          requestOrigin: "http://localhost:3100",
        }),
      ).toBe("http://localhost:3100");
    }
  });
});
