import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppChrome } from "@/components/app-chrome";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fluency Mind",
  description: "Aprenda inglês conversando com uma IA.",
};

async function getPendingReviewCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const dueFlashcards = await new SupabaseCardScheduleRepository(supabase).listDueForUser(
    user.id,
    new Date(),
  );
  return dueFlashcards.length;
}

// Roda antes da hidratação, direto no HTML, pra aplicar o tema (escolha salva
// ou preferência do sistema) antes da primeira pintura — sem isso, a página
// sempre abriria clara por um instante mesmo com o tema escuro escolhido.
// A chave "theme" é a mesma de THEME_STORAGE_KEY em lib/theme.ts (não dá pra
// importar o módulo aqui, então mantenha as duas em sincronia manualmente).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [pendingReviewCount, locale, messages] = await Promise.all([
    getPendingReviewCount(),
    getLocale(),
    getMessages(),
  ]);

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${figtree.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppChrome pendingReviewCount={pendingReviewCount}>{children}</AppChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
