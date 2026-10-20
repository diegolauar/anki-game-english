import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";
import type { FlashcardSuggestionRepository } from "@/domain/ports/flashcard-suggestion-repository";

export interface DiscardFlashcardSuggestionInput {
  flashcardId: string;
  userId: string;
}

export class DiscardFlashcardSuggestion {
  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly flashcardSuggestionRepository: FlashcardSuggestionRepository,
  ) {}

  async execute(input: DiscardFlashcardSuggestionInput): Promise<void> {
    const flashcard = await this.flashcardRepository.findById(input.flashcardId);
    if (!flashcard || flashcard.userId !== input.userId) {
      throw new Error("Flashcard not found.");
    }
    if (flashcard.status !== "suggested") {
      throw new Error("Only suggested flashcards can be discarded.");
    }

    await this.flashcardSuggestionRepository.discard(input.flashcardId);
  }
}
