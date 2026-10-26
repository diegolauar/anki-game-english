"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House, Layers, LogOut, MessagesSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  pendingReviewCount: number;
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    labelKey: "home",
    icon: House,
    match: (path: string) => path === "/dashboard",
  },
  {
    href: "/conversations/new",
    labelKey: "talk",
    icon: MessagesSquare,
    match: (path: string) => path.startsWith("/conversations"),
  },
  {
    href: "/review",
    labelKey: "review",
    icon: BookOpen,
    match: (path: string) => path.startsWith("/review"),
  },
  {
    href: "/flashcards",
    labelKey: "flashcards",
    icon: Layers,
    match: (path: string) => path.startsWith("/flashcards"),
  },
] as const;

export function BottomNav({ pendingReviewCount }: BottomNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-surface p-1.5 shadow-float"
      aria-label={t("ariaLabel")}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-12 items-center gap-2 rounded-full px-[18px] text-sm font-bold transition-colors",
              active ? "bg-acc text-acc-ink" : "text-muted-foreground hover:bg-surface2",
            )}
          >
            <Icon className="size-[22px]" />
            <span className="hidden sm:inline">{t(item.labelKey)}</span>
            {item.href === "/review" && pendingReviewCount > 0 && (
              <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-err px-1 text-[11px] font-bold text-white">
                {pendingReviewCount}
              </span>
            )}
          </Link>
        );
      })}
      <ThemeToggle />
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          aria-label={t("signOut")}
          className="flex h-12 items-center gap-2 rounded-full px-[18px] text-sm font-bold text-muted-foreground transition-colors hover:bg-surface2"
        >
          <LogOut className="size-[22px]" />
        </button>
      </form>
    </nav>
  );
}
