import type { Flashcard } from "@/domain/entities/flashcard";
import type { FlashcardContentUpdate } from "@/domain/ports/flashcard-repository";

export interface CreateManualFlashcardInput {
  userId: string;
  front: string;
  back: string;
  explanation: string | null;
}

/** Gestão direta de um flashcard já existente pelo próprio usuário (fora do pipeline de IA). */
export interface FlashcardEditorRepository {
  createManual(input: CreateManualFlashcardInput): Promise<Flashcard>;
  updateContent(id: string, update: FlashcardContentUpdate): Promise<Flashcard>;
  setStatus(id: string, status: "active" | "suspended"): Promise<Flashcard>;
}
