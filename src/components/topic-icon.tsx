import {
  Clapperboard,
  Clock,
  Flag,
  Gamepad2,
  Hand,
  IdCard,
  Newspaper,
  Plane,
  Sparkles,
  Terminal,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const SLUG_STYLES: Record<string, { icon: LucideIcon; hue: number }> = {
  "daily-routine": { icon: Clock, hue: 180 },
  travel: { icon: Plane, hue: 200 },
  food: { icon: UtensilsCrossed, hue: 40 },
  hobbies: { icon: Gamepad2, hue: 155 },
  "job-interview": { icon: IdCard, hue: 250 },
  "tech-career": { icon: Terminal, hue: 292 },
  "small-talk": { icon: Hand, hue: 80 },
  "opinions-news": { icon: Newspaper, hue: 330 },
  "movies-series": { icon: Clapperboard, hue: 15 },
  "future-plans": { icon: Flag, hue: 120 },
};

const FALLBACK_HUE = 292;

export function TopicIcon({
  slug,
  size = "sm",
}: {
  slug: string | null;
  size?: "sm" | "md";
}) {
  const style = (slug && SLUG_STYLES[slug]) || { icon: Sparkles, hue: FALLBACK_HUE };
  const Icon = style.icon;
  const dimension = size === "md" ? "size-11" : "size-9";
  const iconSize = size === "md" ? "size-[22px]" : "size-4";

  return (
    <span
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-control bg-[oklch(0.94_0.05_var(--tile-h))] text-[oklch(0.48_0.15_var(--tile-h))] dark:bg-[oklch(0.32_0.07_var(--tile-h))] dark:text-[oklch(0.85_0.12_var(--tile-h))]`}
      style={{ "--tile-h": style.hue } as React.CSSProperties}
    >
      <Icon className={iconSize} />
    </span>
  );
}
