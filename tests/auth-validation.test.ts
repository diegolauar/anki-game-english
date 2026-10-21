import { describe, expect, it } from "vitest";
import {
  PASSWORD_REQUIREMENTS,
  newPasswordSchema,
  resetPasswordRequestSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth-validation";

describe("PASSWORD_REQUIREMENTS", () => {
  it("rejects a password missing any required rule", () => {
    expect(PASSWORD_REQUIREMENTS.every((rule) => rule.test("abcdefgh"))).toBe(false); // sem maiúscula/número
    expect(PASSWORD_REQUIREMENTS.every((rule) => rule.test("ABCDEFGH1"))).toBe(false); // sem minúscula
    expect(PASSWORD_REQUIREMENTS.every((rule) => rule.test("Abcdefg1"))).toBe(true);
  });
});

describe("signUpSchema", () => {
  const valid = {
    name: "Ana",
    email: "ana@example.com",
    password: "Abcdefg1",
    confirmPassword: "Abcdefg1",
  };

  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(signUpSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a weak password", () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: "weak", confirmPassword: "weak" }).success,
    ).toBe(false);
  });

  it("rejects mismatched password confirmation", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password (strength is only enforced at sign-up)", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects an empty email or password", () => {
    expect(signInSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("resetPasswordRequestSchema", () => {
  it("requires a valid email", () => {
    expect(resetPasswordRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(resetPasswordRequestSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("requires matching strong passwords", () => {
    expect(
      newPasswordSchema.safeParse({ password: "Abcdefg1", confirmPassword: "Abcdefg1" }).success,
    ).toBe(true);
    expect(
      newPasswordSchema.safeParse({ password: "Abcdefg1", confirmPassword: "Abcdefg2" }).success,
    ).toBe(false);
  });
});
