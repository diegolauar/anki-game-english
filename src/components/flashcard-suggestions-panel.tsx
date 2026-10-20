"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import {
  discardFlashcardSuggestionAction,
  saveAllFlashcardSuggestionsAction,
  saveFlashcardSuggestionAction,
} from "@/app/flashcards/actions";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { CardType } from "@/domain/value-objects/card-type";

const CARD_TYPE_LABELS: Partial<Record<CardType, string>> = {
  production: "Produção",
  cloze: "Lacuna",
};

type LocalStatus = "suggested" | "saving" | "active" | "discarded";

function SuggestionCard({
  flashcard,
  status,
  onSave,
  onDiscard,
}: {
  flashcard: Flashcard;
  status: LocalStatus;
  onSave: (update?: { front: string; back: string; explanation: string | null }) => void;
  onDiscard: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [explanation, setExplanation] = useState(flashcard.explanation ?? "");

  if (status === "active") {
    return (
      <li className="rounded-control border border-ok p-4">
        <p className="text-[15px] font-semibold">{front}</p>
        <p className="mt-1 text-[15px] text-muted-foreground">{back}</p>
        <p className="mt-3 text-sm font-semibold text-ok">✓ Salvo · já disponível para revisar</p>
      </li>
    );
  }

  if (status === "discarded") {
    return (
      <li className="rounded-control border border-line p-4 opacity-50">
        <p className="text-[15px] font-semibold">{front}</p>
        <p className="mt-1 text-[15px] text-muted-foreground">{back}</p>
        <p className="mt-3 text-sm text-muted-foreground">Descartado</p>
      </li>
    );
  }

  return (
    <li className="rounded-control border border-line p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[.04em] text-acc uppercase">
          {CARD_TYPE_LABELS[flashcard.cardType] ?? "Cartão"}
        </span>
      </div>
      <p className="mt-2 text-[15px] font-semibold">{front}</p>
      <p className="mt-1 text-[15px] text-muted-foreground">{back}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={status === "saving"}
          onClick={() => onSave()}
          className="flex h-9 items-center rounded-control bg-ink px-3.5 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-9 items-center rounded-control border border-line px-3.5 text-sm font-semibold hover:border-acc"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="flex h-9 items-center px-2 text-sm font-semibold text-muted-foreground hover:text-ink"
        >
          Descartar
        </button>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar flashcard</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`front-${flashcard.id}`}>Frente</Label>
              <Input id={`front-${flashcard.id}`} value={front} onChange={(e) => setFront(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`back-${flashcard.id}`}>Verso</Label>
              <Input id={`back-${flashcard.id}`} value={back} onChange={(e) => setBack(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`explanation-${flashcard.id}`}>Explicação</Label>
              <Input
                id={`explanation-${flashcard.id}`}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose className="flex h-10 items-center rounded-control border border-line px-4 text-sm font-semibold">
              Cancelar
            </DialogClose>
            <button
              type="button"
              onClick={() => {
                onSave({ front, back, explanation: explanation.trim() || null });
                setEditing(false);
              }}
              className="flex h-10 items-center rounded-control bg-acc px-4 text-sm font-bold text-acc-ink"
            >
              Salvar edição
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [statusByCard, setStatusByCard] = useState<Record<string, LocalStatus>>({});

  if (flashcards.length === 0) return null;

  async function saveOne(
    flashcardId: string,
    update?: { front: string; back: string; explanation: string | null },
  ) {
    setStatusByCard((prev) => ({ ...prev, [flashcardId]: "saving" }));
    const formData = new FormData();
    formData.set("flashcardId", flashcardId);
    formData.set("resultsPath", resultsPath);
    if (update) {
      formData.set("front", update.front);
      formData.set("back", update.back);
      if (update.explanation) formData.set("explanation", update.explanation);
    }
    await saveFlashcardSuggestionAction(formData);
    setStatusByCard((prev) => ({ ...prev, [flashcardId]: "active" }));
  }

  async function discardOne(flashcardId: string) {
    setStatusByCard((prev) => ({ ...prev, [flashcardId]: "saving" }));
    const formData = new FormData();
    formData.set("flashcardId", flashcardId);
    formData.set("resultsPath", resultsPath);
    await discardFlashcardSuggestionAction(formData);
    setStatusByCard((prev) => ({ ...prev, [flashcardId]: "discarded" }));
  }

  async function saveAll() {
    const pendingIds = flashcards
      .map((flashcard) => flashcard.id)
      .filter((id) => !statusByCard[id] || statusByCard[id] === "suggested");
    setStatusByCard((prev) => {
      const next = { ...prev };
      for (const id of pendingIds) next[id] = "saving";
      return next;
    });

    const formData = new FormData();
    for (const id of pendingIds) formData.append("flashcardIds", id);
    formData.set("resultsPath", resultsPath);
    await saveAllFlashcardSuggestionsAction(formData);

    setStatusByCard((prev) => {
      const next = { ...prev };
      for (const id of pendingIds) next[id] = "active";
      return next;
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.01em]">
            Flashcards sugeridos
          </h2>
          <p className="text-xs text-muted-foreground">+2 XP por cartão salvo</p>
        </div>
        <button
          type="button"
          onClick={saveAll}
          className="flex h-10 items-center gap-1.5 rounded-control border border-line px-4 text-sm font-semibold hover:border-acc"
        >
          <CheckCheck className="size-4" />
          Salvar todos
        </button>
      </div>

      <ul
        className="mt-4 grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {flashcards.map((flashcard) => (
          <SuggestionCard
            key={flashcard.id}
            flashcard={flashcard}
            status={statusByCard[flashcard.id] ?? "suggested"}
            onSave={(update) => saveOne(flashcard.id, update)}
            onDiscard={() => discardOne(flashcard.id)}
          />
        ))}
      </ul>
    </section>
  );
}
