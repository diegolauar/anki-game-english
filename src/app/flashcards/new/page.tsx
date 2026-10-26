import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createManualFlashcardAction } from "@/app/flashcards/actions";
import { FlashcardForm } from "@/components/flashcard-form";

export default async function NewFlashcardPage({
  searchParams,
}: {
  searchParams: Promise<{ front?: string; back?: string }>;
}) {
  const { front, back } = await searchParams;
  const [t, tFlashcards] = await Promise.all([
    getTranslations("flashcards.new"),
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

      <FlashcardForm
        action={createManualFlashcardAction}
        submitLabel={t("submit")}
        defaultFront={front}
        defaultBack={back}
      />
    </main>
  );
}
