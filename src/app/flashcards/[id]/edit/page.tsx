import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { editFlashcardAction } from "@/app/flashcards/actions";
import { FlashcardForm } from "@/components/flashcard-form";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";

export default async function EditFlashcardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const flashcard = await new SupabaseFlashcardRepository(supabase).findById(id);
  if (!flashcard || flashcard.userId !== user.id || flashcard.status === "discarded") {
    notFound();
  }

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
        Editar flashcard
      </h1>

      <FlashcardForm
        action={editFlashcardAction}
        submitLabel="Salvar alterações"
        hiddenFields={{ flashcardId: flashcard.id }}
        defaultFront={flashcard.front}
        defaultBack={flashcard.back}
        defaultExplanation={flashcard.explanation ?? ""}
      />
    </main>
  );
}
