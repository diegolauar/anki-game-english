import { cn } from "cn";

const BANNER_TONE_CLASSES = {
  error: "bg-err-soft text-err",
  success: "bg-acc-soft text-acc-strong",
} as const;

export function Banner({
  tone,
  className,
  children,
}: {
  tone: keyof typeof BANNER_TONE_CLASSES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("rounded-control p-3 text-sm", BANNER_TONE_CLASSES[tone], className)}>
      {children}
    </p>
  );
}
