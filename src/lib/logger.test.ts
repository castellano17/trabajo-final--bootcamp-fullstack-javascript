import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

function captureLines(method: "info" | "warn" | "error") {
  const spy = vi.spyOn(console, method).mockImplementation(() => undefined);
  return () =>
    spy.mock.calls.map(
      ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
    );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("writes each event as one JSON line with level, event and timestamp", () => {
    const readLines = captureLines("info");

    logger.info("auth.sign_out", { userId: "user-1" });

    const [entry] = readLines();
    expect(entry).toMatchObject({
      level: "info",
      event: "auth.sign_out",
      userId: "user-1",
    });
    expect(Number.isNaN(Date.parse(String(entry.timestamp)))).toBe(false);
  });

  it("routes warnings and errors to their console methods", () => {
    const readWarnings = captureLines("warn");
    const readErrors = captureLines("error");

    logger.warn("auth.sign_in.failed", { reason: "invalid_credentials" });
    logger.error("auth.unexpected", { reason: "network" });

    expect(readWarnings()[0]).toMatchObject({
      level: "warn",
      event: "auth.sign_in.failed",
    });
    expect(readErrors()[0]).toMatchObject({
      level: "error",
      event: "auth.unexpected",
    });
  });

  it("drops sensitive keys even when they are passed by mistake", () => {
    const readLines = captureLines("warn");

    logger.warn("auth.sign_in.failed", {
      email: "ana@test.local",
      password: "Secreta123",
      passwordConfirmation: "Secreta123",
      captchaToken: "token",
      accessToken: "jwt",
      reason: "invalid_credentials",
      details: { email: "ana@test.local", attempt: 2 },
    });

    const [entry] = readLines();
    expect(entry).toEqual({
      level: "warn",
      event: "auth.sign_in.failed",
      timestamp: expect.any(String),
      reason: "invalid_credentials",
      details: { attempt: 2 },
    });
  });
});
