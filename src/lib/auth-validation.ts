import { z } from "zod";
import type { useTranslations } from "next-intl";

export const PASSWORD_MIN_LENGTH = 8;

type Translator = ReturnType<typeof useTranslations>;

export function buildPasswordRequirements(t: Translator): { label: string; test: (value: string) => boolean }[] {
  return [
    { label: t("passwordMinLength", { min: PASSWORD_MIN_LENGTH }), test: (v) => v.length >= PASSWORD_MIN_LENGTH },
    { label: t("passwordUppercase"), test: (v) => /[A-Z]/.test(v) },
    { label: t("passwordLowercase"), test: (v) => /[a-z]/.test(v) },
    { label: t("passwordNumber"), test: (v) => /[0-9]/.test(v) },
  ];
}

function buildPasswordSchema(t: Translator) {
  const requirements = buildPasswordRequirements(t);
  return z.string().refine((value) => requirements.every((rule) => rule.test(value)), {
    message: t("passwordRequirementsNotMet"),
  });
}

export function buildSignUpSchema(t: Translator) {
  return z
    .object({
      name: z.string().trim().min(1, t("nameRequired")).max(120, t("nameTooLong")),
      email: z.string().trim().min(1, t("emailRequired")).email(t("emailInvalid")),
      password: buildPasswordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });
}

export type SignUpInput = z.infer<ReturnType<typeof buildSignUpSchema>>;

export function buildSignInSchema(t: Translator) {
  return z.object({
    email: z.string().trim().min(1, t("emailRequired")).email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export type SignInInput = z.infer<ReturnType<typeof buildSignInSchema>>;

export function buildResetPasswordRequestSchema(t: Translator) {
  return z.object({
    email: z.string().trim().min(1, t("emailRequired")).email(t("emailInvalid")),
  });
}

export function buildNewPasswordSchema(t: Translator) {
  return z
    .object({
      password: buildPasswordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });
}
