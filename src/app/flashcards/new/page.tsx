import { createManualFlashcardAction } from "@/app/flashcards/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewFlashcardPage() {
  return (
    <main className="mx-auto max-w-xl flex-1 p-8">
      <h1 className="text-2xl font-semibold">Criar flashcard manual</h1>

      <form action={createManualFlashcardAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="front">Frente</Label>
          <Input id="front" name="front" required placeholder="Pergunta ou situação em português" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="back">Verso</Label>
          <Input id="back" name="back" required placeholder="Frase em inglês" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="explanation">Explicação (opcional)</Label>
          <Input id="explanation" name="explanation" placeholder="Contexto ou dica extra" />
        </div>

        <Button type="submit">Criar flashcard</Button>
      </form>
    </main>
  );
}
