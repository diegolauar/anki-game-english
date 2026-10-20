import type { Flashcard } from "@/domain/entities/flashcard";
import type { FlashcardStatus } from "@/domain/value-objects/flashcard-status";

export interface CreateSuggestedFlashcardInput {
  userId: string;
  learningPointId: string;
  sourceFindingId: string;
  cardType: "production" | "cloze";
  front: string;
  back: string;
  explanation: string | null;
}

export interface CreateManualFlashcardInput {
  userId: string;
  front: string;
  back: string;
  explanation: string | null;
}

export interface FlashcardContentUpdate {
  front?: string;
  back?: string;
  explanation?: string | null;
}

export interface FlashcardRepository {
  hasActiveForLearningPoint(learningPointId: string): Promise<boolean>;
  createSuggested(input: CreateSuggestedFlashcardInput): Promise<Flashcard>;
  createManual(input: CreateManualFlashcardInput): Promise<Flashcard>;
  findById(id: string): Promise<Flashcard | null>;
  listBySourceFindingIds(findingIds: string[]): Promise<Flashcard[]>;
  listByUser(userId: string, status?: FlashcardStatus): Promise<Flashcard[]>;
  activate(id: string, overrides: FlashcardContentUpdate): Promise<Flashcard>;
  discard(id: string): Promise<Flashcard>;
  updateContent(id: string, update: FlashcardContentUpdate): Promise<Flashcard>;
  setStatus(id: string, status: "active" | "suspended"): Promise<Flashcard>;
}
