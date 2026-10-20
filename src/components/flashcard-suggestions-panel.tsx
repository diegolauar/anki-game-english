"use client";

import { useState } from "react";
import {
  discardFlashcardSuggestionAction,
  saveAllFlashcardSuggestionsAction,
  saveFlashcardSuggestionAction,
} from "@/app/flashcards/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Flashcard } from "@/domain/entities/flashcard";

function SuggestionCard({
  flashcard,
  resultsPath,
}: {
  flashcard: Flashcard;
  resultsPath: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <li className="rounded-lg border p-4">
      {!isEditing ? (
        <>
          <p className="text-sm font-medium">{flashcard.front}</p>
          <p className="mt-1 text-sm text-muted-foreground">{flashcard.back}</p>
          <div className="mt-3 flex gap-2">
            <form action={saveFlashcardSuggestionAction}>
              <input type="hidden" name="flashcardId" value={flashcard.id} />
              <input type="hidden" name="resultsPath" value={resultsPath} />
              <Button type="submit" size="sm">
                Salvar
              </Button>
            </form>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
            <form action={discardFlashcardSuggestionAction}>
              <input type="hidden" name="flashcardId" value={flashcard.id} />
              <input type="hidden" name="resultsPath" value={resultsPath} />
              <Button type="submit" variant="ghost" size="sm">
                Descartar
              </Button>
            </form>
          </div>
        </>
      ) : (
        <form action={saveFlashcardSuggestionAction} className="flex flex-col gap-2">
          <input type="hidden" name="flashcardId" value={flashcard.id} />
          <input type="hidden" name="resultsPath" value={resultsPath} />
          <Label htmlFor={`front-${flashcard.id}`}>Frente</Label>
          <Input id={`front-${flashcard.id}`} name="front" defaultValue={flashcard.front} />
          <Label htmlFor={`back-${flashcard.id}`}>Verso</Label>
          <Input id={`back-${flashcard.id}`} name="back" defaultValue={flashcard.back} />
          <div className="mt-2 flex gap-2">
            <Button type="submit" size="sm">
              Salvar edição
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}

export function FlashcardSuggestionsPanel({
  flashcards,
  resultsPath,
}: {
  flashcards: Flashcard[];
  resultsPath: string;
}) {
  if (flashcards.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Flashcards sugeridos</h2>
        <form action={saveAllFlashcardSuggestionsAction}>
          {flashcards.map((flashcard) => (
            <input key={flashcard.id} type="hidden" name="flashcardIds" value={flashcard.id} />
          ))}
          <input type="hidden" name="resultsPath" value={resultsPath} />
          <Button type="submit" variant="outline" size="sm">
            Salvar todos
          </Button>
        </form>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {flashcards.map((flashcard) => (
          <SuggestionCard key={flashcard.id} flashcard={flashcard} resultsPath={resultsPath} />
        ))}
      </ul>
    </section>
  );
}
