import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

type LegalSection = {
  title: string;
  body: string;
};

export async function LegalDocument({ documentKey }: { documentKey: "terms" | "privacy" }) {
  const t = await getTranslations("legal");
  const title = t(`${documentKey}.title`);
  const updatedAt = t(`${documentKey}.updatedAt`);
  const intro = t(`${documentKey}.intro`);
  const sections = t.raw(`${documentKey}.sections`) as LegalSection[];

  return (
    <main className="flex min-h-dvh flex-1 justify-center p-8 pb-20">
      <div className="flex w-full max-w-[640px] flex-col gap-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          {t("backToLogin")}
        </Link>

        <div>
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{updatedAt}</p>
          <p className="mt-4 text-[15px] text-muted-foreground">{intro}</p>
        </div>

        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-lg font-bold">{section.title}</h2>
              <div className="mt-1.5 flex flex-col gap-2 text-[15px] text-muted-foreground">
                {section.body.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
