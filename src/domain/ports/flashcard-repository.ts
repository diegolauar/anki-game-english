import type { Flashcard } from "@/domain/entities/flashcard";

export interface CreateSuggestedFlashcardInput {
  userId: string;
  learningPointId: string;
  sourceFindingId: string;
  cardType: "production" | "cloze";
  front: string;
  back: string;
  explanation: string | null;
}

export interface FlashcardRepository {
  hasActiveForLearningPoint(learningPointId: string): Promise<boolean>;
  createSuggested(input: CreateSuggestedFlashcardInput): Promise<Flashcard>;
}
