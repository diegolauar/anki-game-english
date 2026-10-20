import type { CardState } from "@/domain/value-objects/card-state";

export interface ScheduleSnapshot {
  dueAt: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReviewedAt: string | null;
}

export interface CardSchedule extends ScheduleSnapshot {
  flashcardId: string;
}
