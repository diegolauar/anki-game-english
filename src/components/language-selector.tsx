"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocaleAction } from "@/app/actions";
import { LOCALES, type Locale } from "@/domain/value-objects/locale";

const LANGUAGE_NAMES: Record<Locale, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  es: "Español",
};

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Locale;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      disabled={isPending}
      onChange={handleChange}
      aria-label={t("language")}
      className="h-12 rounded-full border border-line bg-transparent px-4 text-sm font-bold text-muted-foreground transition-colors hover:bg-surface2 disabled:opacity-60"
    >
      {LOCALES.map((value) => (
        <option key={value} value={value}>
          {LANGUAGE_NAMES[value]}
        </option>
      ))}
    </select>
  );
}
