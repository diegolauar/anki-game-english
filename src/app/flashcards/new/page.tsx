import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createManualFlashcardAction } from "@/app/flashcards/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

      <form action={createManualFlashcardAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="front">Frente</Label>
          <Input
            id="front"
            name="front"
            required
            defaultValue={front}
            placeholder="Pergunta ou situação em português"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="back">Verso</Label>
          <Input id="back" name="back" required defaultValue={back} placeholder="Frase em inglês" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="explanation">Explicação (opcional)</Label>
          <Input id="explanation" name="explanation" placeholder="Contexto ou dica extra" />
        </div>

        <button
          type="submit"
          className="mt-2 flex h-12 items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink"
        >
          Criar flashcard
        </button>
      </form>
    </main>
  );
}
