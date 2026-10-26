import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { requireUser } from "@/infrastructure/supabase/require-user";

export default async function ResetPasswordPage() {
  await requireUser();
  const t = await getTranslations("resetPassword");

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-[380px] flex-col gap-6">
        <div>
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
