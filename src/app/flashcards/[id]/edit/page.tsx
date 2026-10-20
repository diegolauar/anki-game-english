import { notFound } from "next/navigation";
import { editFlashcardAction } from "@/app/flashcards/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main className="mx-auto max-w-xl flex-1 p-8">
      <h1 className="text-2xl font-semibold">Editar flashcard</h1>

      <form action={editFlashcardAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="flashcardId" value={flashcard.id} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="front">Frente</Label>
          <Input id="front" name="front" required defaultValue={flashcard.front} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="back">Verso</Label>
          <Input id="back" name="back" required defaultValue={flashcard.back} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="explanation">Explicação (opcional)</Label>
          <Input id="explanation" name="explanation" defaultValue={flashcard.explanation ?? ""} />
        </div>

        <Button type="submit">Salvar alterações</Button>
      </form>
    </main>
  );
}
