import type { Flashcard } from "@/domain/entities/flashcard";
import type { FlashcardStatus } from "@/domain/value-objects/flashcard-status";

export interface FlashcardContentUpdate {
  front?: string;
  back?: string;
  explanation?: string | null;
}

/** Leituras genéricas de flashcards — usado por quase todo caso de uso da área. */
export interface FlashcardRepository {
  findById(id: string): Promise<Flashcard | null>;
  listBySourceFindingIds(findingIds: string[]): Promise<Flashcard[]>;
  listByUser(userId: string, status?: FlashcardStatus): Promise<Flashcard[]>;
}
