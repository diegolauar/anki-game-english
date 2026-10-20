import type { Flashcard } from "@/domain/entities/flashcard";
import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";

export interface ToggleFlashcardSuspensionInput {
  flashcardId: string;
  userId: string;
}

export class ToggleFlashcardSuspension {
  constructor(private readonly flashcardRepository: FlashcardRepository) {}

  async execute(input: ToggleFlashcardSuspensionInput): Promise<Flashcard> {
    const flashcard = await this.flashcardRepository.findById(input.flashcardId);
    if (!flashcard || flashcard.userId !== input.userId) {
      throw new Error("Flashcard not found.");
    }
    if (flashcard.status !== "active" && flashcard.status !== "suspended") {
      throw new Error("Only active or suspended flashcards can be toggled.");
    }

    const nextStatus = flashcard.status === "active" ? "suspended" : "active";
    return this.flashcardRepository.setStatus(input.flashcardId, nextStatus);
  }
}
