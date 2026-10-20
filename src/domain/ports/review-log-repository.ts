import type { ReviewLog } from "@/domain/entities/review-log";
import type { CardState } from "@/domain/value-objects/card-state";
import type { Rating } from "@/domain/value-objects/rating";

export interface CreateReviewLogInput {
  flashcardId: string;
  userId: string;
  rating: Rating;
  stateBefore: CardState;
  elapsedDays: number;
  scheduledDays: number;
}

export interface ReviewLogRepository {
  create(input: CreateReviewLogInput): Promise<ReviewLog>;
}
