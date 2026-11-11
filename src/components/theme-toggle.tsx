"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeToggle() {
  const t = useTranslations("common");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Lê o estado real do DOM só depois de montar: o servidor não tem acesso
    // a `document`/localStorage, então o primeiro render tem que assumir
    // "claro" pra bater com o HTML gerado no servidor (evita mismatch de
    // hidratação) — o script inline em app/layout.tsx já aplicou a classe
    // `.dark` correta antes disso, este efeito só sincroniza o ícone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage bloqueado (modo privado etc.) — a escolha vale só pra esta aba.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t("switchToLightTheme") : t("switchToDarkTheme")}
      className="flex h-10 shrink-0 items-center justify-center rounded-full px-3 text-muted-foreground transition-colors hover:bg-surface2 sm:h-12 sm:px-[18px]"
    >
      {isDark ? <Sun className="size-[18px] sm:size-[22px]" /> : <Moon className="size-[18px] sm:size-[22px]" />}
    </button>
  );
}
