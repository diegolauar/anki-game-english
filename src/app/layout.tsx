import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Geist_Mono } from "next/font/google";
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
  title: "English Quest",
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pendingReviewCount = await getPendingReviewCount();

  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <AppChrome pendingReviewCount={pendingReviewCount}>{children}</AppChrome>
      </body>
    </html>
  );
}
