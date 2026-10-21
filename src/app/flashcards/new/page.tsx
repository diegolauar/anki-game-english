import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createManualFlashcardAction } from "@/app/flashcards/actions";
import { FlashcardForm } from "@/components/flashcard-form";

export default async function NewFlashcardPage({
  searchParams,
}: {
  searchParams: Promise<{ front?: string; back?: string }>;
}) {
  const { front, back } = await searchParams;

  return (
    <main className="mx-auto max-w-xl flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      <Link
        href="/flashcards"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Flashcards
      </Link>
      <h1 className="mt-2 font-display text-[32px] font-bold tracking-[-0.02em]">
        Criar flashcard manual
      </h1>

      <FlashcardForm
        action={createManualFlashcardAction}
        submitLabel="Criar flashcard"
        defaultFront={front}
        defaultBack={back}
      />
    </main>
  );
}
