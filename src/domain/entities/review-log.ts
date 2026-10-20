import type { CardState } from "@/domain/value-objects/card-state";
import type { Rating } from "@/domain/value-objects/rating";

export interface ReviewLog {
  id: string;
  flashcardId: string;
  userId: string;
  rating: Rating;
  stateBefore: CardState;
  elapsedDays: number;
  scheduledDays: number;
  reviewedAt: string;
}
