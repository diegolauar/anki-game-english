import type { Flashcard } from "@/domain/entities/flashcard";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";
import type { ReviewScheduler } from "@/domain/ports/review-scheduler";

export interface SaveFlashcardSuggestionInput {
  flashcardId: string;
  userId: string;
  front?: string;
  back?: string;
  explanation?: string | null;
}

export class SaveFlashcardSuggestion {
  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
    private readonly reviewScheduler: ReviewScheduler,
  ) {}

  async execute(input: SaveFlashcardSuggestionInput): Promise<Flashcard> {
    const flashcard = await this.flashcardRepository.findById(input.flashcardId);
    if (!flashcard || flashcard.userId !== input.userId) {
      throw new Error("Flashcard not found.");
    }
    if (flashcard.status !== "suggested") {
      throw new Error("Only suggested flashcards can be saved.");
    }

    const activated = await this.flashcardRepository.activate(input.flashcardId, {
      front: input.front,
      back: input.back,
      explanation: input.explanation,
    });

    await this.cardScheduleRepository.create(activated.id, this.reviewScheduler.initialState(new Date()));

    return activated;
  }
}
