import { Briefcase, Clapperboard, Coffee, Newspaper, Sparkles, Users, type LucideIcon } from "lucide-react";

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  career: { icon: Briefcase, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  lifestyle: { icon: Coffee, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  social: { icon: Users, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  current_events: { icon: Newspaper, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  entertainment: { icon: Clapperboard, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const FALLBACK_STYLE = {
  icon: Sparkles,
  className: "bg-muted text-muted-foreground",
};

export function TopicIcon({ category }: { category: string | null }) {
  const { icon: Icon, className } = (category && CATEGORY_STYLES[category]) || FALLBACK_STYLE;

  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${className}`}>
      <Icon className="size-4" />
    </span>
  );
}
