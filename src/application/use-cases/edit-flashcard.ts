import type { Flashcard } from "@/domain/entities/flashcard";
import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";

export interface EditFlashcardInput {
  flashcardId: string;
  userId: string;
  front?: string;
  back?: string;
  explanation?: string | null;
}

export class EditFlashcard {
  constructor(private readonly flashcardRepository: FlashcardRepository) {}

  async execute(input: EditFlashcardInput): Promise<Flashcard> {
    const flashcard = await this.flashcardRepository.findById(input.flashcardId);
    if (!flashcard || flashcard.userId !== input.userId) {
      throw new Error("Flashcard not found.");
    }
    if (flashcard.status === "discarded") {
      throw new Error("Discarded flashcards cannot be edited.");
    }

    return this.flashcardRepository.updateContent(input.flashcardId, {
      front: input.front,
      back: input.back,
      explanation: input.explanation,
    });
  }
}
