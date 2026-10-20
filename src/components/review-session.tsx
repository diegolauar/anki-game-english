"use client";

import { useState } from "react";
import { reviewFlashcardAction } from "@/app/flashcards/actions";
import { Button } from "@/components/ui/button";
import type { DueFlashcard } from "@/domain/ports/card-schedule-repository";
import type { Rating } from "@/domain/value-objects/rating";

const RATING_LABELS: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

export function ReviewSession({ dueFlashcards }: { dueFlashcards: DueFlashcard[] }) {
  const [queue] = useState(dueFlashcards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = queue[index];

  async function handleRate(rating: Rating) {
    if (!current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await reviewFlashcardAction({ flashcardId: current.flashcard.id, rating });
      setIndex((previous) => previous + 1);
      setRevealed(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-lg font-medium">Nenhum cartão pendente por agora.</p>
        <p className="text-sm text-muted-foreground">Volte mais tarde para revisar outros.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <p className="text-sm text-muted-foreground">
        {index + 1} de {queue.length}
      </p>

      <div className="rounded-lg border p-6">
        <p className="text-lg">{current.flashcard.front}</p>
        {revealed && (
          <>
            <hr className="my-4" />
            <p className="text-lg font-medium">{current.flashcard.back}</p>
            {current.flashcard.explanation && (
              <p className="mt-2 text-sm text-muted-foreground">
                {current.flashcard.explanation}
              </p>
            )}
          </>
        )}
      </div>

      {!revealed ? (
        <Button onClick={() => setRevealed(true)}>Revelar</Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(RATING_LABELS) as Rating[]).map((rating) => (
            <Button
              key={rating}
              variant={rating === "again" ? "destructive" : "outline"}
              disabled={isSubmitting}
              onClick={() => handleRate(rating)}
            >
              {RATING_LABELS[rating]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
