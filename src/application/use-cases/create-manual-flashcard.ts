import { AwardXp } from "@/application/use-cases/award-xp";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";
import type { ReviewScheduler } from "@/domain/ports/review-scheduler";
import type { XpEventRepository } from "@/domain/ports/xp-event-repository";

export interface CreateManualFlashcardInput {
  userId: string;
  front: string;
  back: string;
  explanation: string | null;
}

export class CreateManualFlashcard {
  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
    private readonly reviewScheduler: ReviewScheduler,
    private readonly xpEventRepository: XpEventRepository,
  ) {}

  async execute(input: CreateManualFlashcardInput): Promise<Flashcard> {
    if (!input.front.trim() || !input.back.trim()) {
      throw new Error("Front and back are required.");
    }

    const flashcard = await this.flashcardRepository.createManual(input);
    await this.cardScheduleRepository.create(flashcard.id, this.reviewScheduler.initialState(new Date()));

    await new AwardXp(this.xpEventRepository).execute({
      userId: input.userId,
      sourceType: "flashcard_saved",
      sourceId: flashcard.id,
    });

    return flashcard;
  }
}
