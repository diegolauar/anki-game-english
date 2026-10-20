import { AwardXp } from "@/application/use-cases/award-xp";
import type { ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";
import type { ReviewLogRepository } from "@/domain/ports/review-log-repository";
import type { ReviewScheduler } from "@/domain/ports/review-scheduler";
import type { XpEventRepository } from "@/domain/ports/xp-event-repository";
import type { Rating } from "@/domain/value-objects/rating";

export interface ReviewFlashcardInput {
  flashcardId: string;
  userId: string;
  rating: Rating;
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class ReviewFlashcard {
  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
    private readonly reviewLogRepository: ReviewLogRepository,
    private readonly reviewScheduler: ReviewScheduler,
    private readonly xpEventRepository: XpEventRepository,
  ) {}

  async execute(input: ReviewFlashcardInput): Promise<ScheduleSnapshot> {
    const flashcard = await this.flashcardRepository.findById(input.flashcardId);
    if (!flashcard || flashcard.userId !== input.userId) {
      throw new Error("Flashcard not found.");
    }
    if (flashcard.status !== "active") {
      throw new Error("Only active flashcards can be reviewed.");
    }

    const currentSchedule = await this.cardScheduleRepository.findByFlashcardId(input.flashcardId);
    if (!currentSchedule) {
      throw new Error("This flashcard has no schedule yet.");
    }

    const now = new Date();
    const outcome = this.reviewScheduler.review(currentSchedule, input.rating, now);

    await this.cardScheduleRepository.update(input.flashcardId, outcome.schedule);
    const reviewLog = await this.reviewLogRepository.create({
      flashcardId: input.flashcardId,
      userId: input.userId,
      rating: input.rating,
      stateBefore: currentSchedule.state,
      elapsedDays: outcome.elapsedDays,
      scheduledDays: outcome.scheduledDays,
    });

    const awardXp = new AwardXp(this.xpEventRepository);
    await awardXp.execute({
      userId: input.userId,
      sourceType: "flashcard_reviewed",
      sourceId: reviewLog.id,
    });

    const remainingDue = await this.cardScheduleRepository.listDueForUser(input.userId, now);
    if (remainingDue.length === 0) {
      await awardXp.execute({
        userId: input.userId,
        sourceType: "daily_reviews_completed",
        sourceId: todayDateKey(),
      });
    }

    return outcome.schedule;
  }
}
