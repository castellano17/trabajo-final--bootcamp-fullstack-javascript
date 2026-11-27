import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

describe("getSafeRedirectPath", () => {
  it.each([
    ["/lugares", "/lugares"],
    [
      "/lugares/tacos-el-guero?orden=recientes#resenas",
      "/lugares/tacos-el-guero?orden=recientes#resenas",
    ],
    ["/", "/"],
  ])("keeps the internal path %s", (next, expected) => {
    expect(getSafeRedirectPath(next)).toBe(expected);
  });

  it.each([
    ["https://externo.com"],
    ["//externo.com"],
    ["/\\externo.com"],
    ["\\\\externo.com"],
    ["javascript:alert(1)"],
    ["lugares"],
    [" /lugares"],
    [""],
    [null],
    [undefined],
  ])("sends %s to the home page", (next) => {
    expect(getSafeRedirectPath(next)).toBe("/");
  });

  it("uses the given fallback for unsafe values", () => {
    expect(getSafeRedirectPath("https://externo.com", "/iniciar-sesion")).toBe(
      "/iniciar-sesion",
    );
  });
});
