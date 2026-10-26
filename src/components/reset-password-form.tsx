"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordRequirements } from "@/components/password-requirements";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { buildNewPasswordSchema } from "@/lib/auth-validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("resetPassword");
  const tValidation = useTranslations("validation");
  const newPasswordSchema = useMemo(() => buildNewPasswordSchema(tValidation), [tValidation]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "");
      return;
    }

    setStatus("loading");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      setStatus("error");
      setErrorMessage(t("updateError"));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">{t("newPasswordLabel")}</Label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        {password.length > 0 && <PasswordRequirements password={password} />}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-new-password">{t("confirmNewPasswordLabel")}</Label>
        <PasswordInput
          id="confirm-new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" disabled={status === "loading"} className="h-[50px] text-[15px]">
        {status === "loading" ? t("saving") : t("submit")}
      </Button>
      {status === "error" && <p className="text-sm text-err">{errorMessage}</p>}
    </form>
  );
}
