import { describe, expect, it } from "vitest";

import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  resendConfirmationSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas";

const validSignUp = {
  displayName: "  Ana  ",
  email: "ana@test.local",
  password: "Secreta123",
  captchaToken: "token",
};

function fieldErrorsOf(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) {
  return result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
}

describe("signUpSchema", () => {
  it("accepts a valid sign-up and trims the display name", () => {
    const result = signUpSchema.safeParse(validSignUp);

    expect(result.success).toBe(true);
    expect(result.data?.displayName).toBe("Ana");
  });

  it.each([
    ["password", "a common lowercase word"],
    ["Secreta", "a password shorter than 8 characters"],
    ["secreta123", "a password without uppercase letters"],
    ["SECRETA123", "a password without lowercase letters"],
    ["SecretaSinNumero", "a password without digits"],
    [`Aa1${"x".repeat(70)}`, "a password longer than 72 characters"],
  ])("rejects the weak password %s (%s) on the password field", (password) => {
    const result = signUpSchema.safeParse({ ...validSignUp, password });

    expect(result.success).toBe(false);
    expect(fieldErrorsOf(result)).toContain("password");
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      email: "no-es-un-correo",
    });

    expect(fieldErrorsOf(result)).toContain("email");
  });

  it("rejects a sign-up without a captcha token", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, captchaToken: "" });

    expect(fieldErrorsOf(result)).toContain("captchaToken");
  });

  it("rejects an empty display name", () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      displayName: "   ",
    });

    expect(fieldErrorsOf(result)).toContain("displayName");
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password so old passwords still sign in", () => {
    const result = signInSchema.safeParse({
      email: "ana@test.local",
      password: "x",
      captchaToken: "token",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "ana@test.local",
      password: "",
      captchaToken: "token",
    });

    expect(fieldErrorsOf(result)).toContain("password");
  });
});

describe("passwordUpdateSchema", () => {
  it("rejects a confirmation that does not match", () => {
    const result = passwordUpdateSchema.safeParse({
      password: "Secreta123",
      passwordConfirmation: "Secreta124",
    });

    expect(fieldErrorsOf(result)).toContain("passwordConfirmation");
  });

  it("applies the same password policy as sign-up", () => {
    const result = passwordUpdateSchema.safeParse({
      password: "password",
      passwordConfirmation: "password",
    });

    expect(fieldErrorsOf(result)).toContain("password");
  });
});

describe("email-only schemas", () => {
  it.each([
    ["passwordResetRequestSchema", passwordResetRequestSchema],
    ["resendConfirmationSchema", resendConfirmationSchema],
  ])("%s requires a valid email and a captcha token", (_name, schema) => {
    expect(
      schema.safeParse({ email: "ana@test.local", captchaToken: "token" })
        .success,
    ).toBe(true);
    expect(
      fieldErrorsOf(schema.safeParse({ email: "x", captchaToken: "" })),
    ).toEqual(expect.arrayContaining(["email", "captchaToken"]));
  });
});
