import { AwardXp } from "@/application/use-cases/award-xp";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type {
  CreateManualFlashcardInput,
  FlashcardEditorRepository,
} from "@/domain/ports/flashcard-editor-repository";
import type { ReviewScheduler } from "@/domain/ports/review-scheduler";
import type { XpEventWriter } from "@/domain/ports/xp-event-writer";

export class CreateManualFlashcard {
  constructor(
    private readonly flashcardEditorRepository: FlashcardEditorRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
    private readonly reviewScheduler: ReviewScheduler,
    private readonly xpEventWriter: XpEventWriter,
  ) {}

  async execute(input: CreateManualFlashcardInput): Promise<Flashcard> {
    if (!input.front.trim() || !input.back.trim()) {
      throw new Error("Front and back are required.");
    }

    const flashcard = await this.flashcardEditorRepository.createManual(input);
    await this.cardScheduleRepository.create(flashcard.id, this.reviewScheduler.initialState(new Date()));

    await new AwardXp(this.xpEventWriter).execute({
      userId: input.userId,
      sourceType: "flashcard_saved",
      sourceId: flashcard.id,
    });

    return flashcard;
  }
}
