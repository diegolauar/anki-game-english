"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { buildResetPasswordRequestSchema } from "@/lib/auth-validation";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const tValidation = useTranslations("validation");
  const resetPasswordRequestSchema = useMemo(
    () => buildResetPasswordRequestSchema(tValidation),
    [tValidation],
  );
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = resetPasswordRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    // Sempre mostra sucesso, exista ou não conta com esse e-mail — evita
    // confirmar pra quem está testando se um e-mail tem cadastro.
    setStatus("sent");
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-[380px] flex-col gap-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          {t("backToSignIn")}
        </Link>

        {status === "sent" ? (
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">{t("sentTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("sentMessage", { email })}</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">{t("title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className={status === "error" ? "border-err" : undefined}
                />
              </div>
              <Button type="submit" disabled={status === "loading"} className="h-[50px] text-[15px]">
                {status === "loading" ? t("sending") : t("submit")}
              </Button>
              {status === "error" && <p className="text-sm text-err">{t("invalidEmail")}</p>}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
