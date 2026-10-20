import type { Flashcard } from "@/domain/entities/flashcard";
import type { SaveFlashcardSuggestion } from "@/application/use-cases/save-flashcard-suggestion";

export interface SaveFlashcardSuggestionsInput {
  flashcardIds: string[];
  userId: string;
}

export class SaveFlashcardSuggestions {
  constructor(private readonly saveFlashcardSuggestion: SaveFlashcardSuggestion) {}

  async execute(input: SaveFlashcardSuggestionsInput): Promise<Flashcard[]> {
    const saved: Flashcard[] = [];
    for (const flashcardId of input.flashcardIds) {
      saved.push(
        await this.saveFlashcardSuggestion.execute({ flashcardId, userId: input.userId }),
      );
    }
    return saved;
  }
}
