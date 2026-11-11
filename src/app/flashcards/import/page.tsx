import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { importFlashcardsAction } from "@/app/flashcards/actions";
import { Banner } from "@/components/banner";
import { FilePicker } from "@/components/file-picker";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/infrastructure/supabase/require-user";

export default async function ImportFlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; skipped?: string; error?: string }>;
}) {
  await requireUser();

  const { created, skipped, error } = await searchParams;
  const [t, tFlashcards] = await Promise.all([
    getTranslations("flashcards.import"),
    getTranslations("flashcards"),
  ]);

  return (
    <main className="mx-auto max-w-xl flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      <Link
        href="/flashcards"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {tFlashcards("heading")}
      </Link>
      <h1 className="mt-2 font-display text-[32px] font-bold tracking-[-0.02em]">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.rich("description", { strong: (chunks) => <strong>{chunks}</strong> })}
      </p>

      {error && (
        <Banner tone="error" className="mt-4">
          {error}
        </Banner>
      )}
      {created !== undefined && !error && (
        <Banner tone="success" className="mt-4">
          {t("importedSummary", { created: Number(created) })}
          {skipped && skipped !== "0" ? t("skippedSummary", { skipped: Number(skipped) }) : ""}
        </Banner>
      )}

      <form action={importFlashcardsAction} className="mt-6 flex flex-col gap-4">
        <FilePicker name="file" accept=".csv,.txt,text/csv,text/plain" placeholder={t("chooseFile")} />

        <SubmitButton
          pendingLabel={t("importing")}
          className="flex h-12 items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink disabled:opacity-60"
        >
          {t("submit")}
        </SubmitButton>
      </form>

      <div className="mt-8 rounded-card border border-line bg-surface p-4 text-sm">
        <p className="font-bold">{t("csvExampleHeading")}</p>
        <pre className="mt-2 overflow-x-auto rounded-control bg-bg p-3 text-[12.5px] text-muted-foreground">
{`front,back,explanation
Como digo "bom dia"?,Good morning,
Como digo que trabalhei muito ontem?,I worked a lot yesterday,Simple Past para ação concluída`}
        </pre>
        <p className="mt-3 font-bold">{t("txtExampleHeading")}</p>
        <pre className="mt-2 overflow-x-auto rounded-control bg-bg p-3 text-[12.5px] text-muted-foreground">
{`front;back;explanation
Como digo "bom dia"?;Good morning;
Como digo que trabalhei muito ontem?;I worked a lot yesterday;Simple Past para ação concluída`}
        </pre>
      </div>
    </main>
  );
}
