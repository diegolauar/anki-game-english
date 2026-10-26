import { describe, expect, it } from "vitest";
import {
  buildNewPasswordSchema,
  buildPasswordRequirements,
  buildResetPasswordRequestSchema,
  buildSignInSchema,
  buildSignUpSchema,
} from "@/lib/auth-validation";

// Fake tradutor: só precisa devolver uma string (os testes checam validade do
// schema, não o texto exato da mensagem — esse fica a cargo do next-intl).
const t = ((key: string) => key) as unknown as Parameters<typeof buildSignUpSchema>[0];

describe("buildPasswordRequirements", () => {
  it("rejects a password missing any required rule", () => {
    const requirements = buildPasswordRequirements(t);
    expect(requirements.every((rule) => rule.test("abcdefgh"))).toBe(false); // sem maiúscula/número
    expect(requirements.every((rule) => rule.test("ABCDEFGH1"))).toBe(false); // sem minúscula
    expect(requirements.every((rule) => rule.test("Abcdefg1"))).toBe(true);
  });
});

describe("buildSignUpSchema", () => {
  const signUpSchema = buildSignUpSchema(t);
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

describe("buildSignInSchema", () => {
  const signInSchema = buildSignInSchema(t);

  it("accepts any non-empty password (strength is only enforced at sign-up)", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects an empty email or password", () => {
    expect(signInSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("buildResetPasswordRequestSchema", () => {
  const resetPasswordRequestSchema = buildResetPasswordRequestSchema(t);

  it("requires a valid email", () => {
    expect(resetPasswordRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(resetPasswordRequestSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("buildNewPasswordSchema", () => {
  const newPasswordSchema = buildNewPasswordSchema(t);

  it("requires matching strong passwords", () => {
    expect(
      newPasswordSchema.safeParse({ password: "Abcdefg1", confirmPassword: "Abcdefg1" }).success,
    ).toBe(true);
    expect(
      newPasswordSchema.safeParse({ password: "Abcdefg1", confirmPassword: "Abcdefg2" }).success,
    ).toBe(false);
  });
});
