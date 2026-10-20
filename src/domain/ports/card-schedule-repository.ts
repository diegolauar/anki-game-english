import type { CardSchedule, ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { Flashcard } from "@/domain/entities/flashcard";

export interface DueFlashcard {
  flashcard: Flashcard;
  schedule: CardSchedule;
}

export interface CardScheduleRepository {
  create(flashcardId: string, schedule: ScheduleSnapshot): Promise<void>;
  findByFlashcardId(flashcardId: string): Promise<CardSchedule | null>;
  update(flashcardId: string, schedule: ScheduleSnapshot): Promise<void>;
  listDueForUser(userId: string, now: Date): Promise<DueFlashcard[]>;
  listByFlashcardIds(flashcardIds: string[]): Promise<CardSchedule[]>;
}
