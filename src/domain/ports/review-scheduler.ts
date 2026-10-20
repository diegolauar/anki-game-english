import type { ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { Rating } from "@/domain/value-objects/rating";

export interface ReviewOutcome {
  schedule: ScheduleSnapshot;
  elapsedDays: number;
  scheduledDays: number;
}

export interface ReviewScheduler {
  initialState(now: Date): ScheduleSnapshot;
  review(current: ScheduleSnapshot, rating: Rating, now: Date): ReviewOutcome;
}
