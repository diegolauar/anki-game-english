import type { CardSchedule, ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { Flashcard } from "@/domain/entities/flashcard";

export interface DueFlashcard {
  flashcard: Flashcard;
  schedule: CardSchedule;
}

export const FLASHCARD_LIST_FILTERS = ["pending", "new", "reviewed", "suspended", "all"] as const;
export type FlashcardListFilter = (typeof FLASHCARD_LIST_FILTERS)[number];

export interface ListFlashcardsPageInput {
  userId: string;
  filter: FlashcardListFilter;
  /** Busca por substring em front/back; null ou vazio = sem filtro de busca. */
  search: string | null;
  now: Date;
  /** 1-based. */
  page: number;
  pageSize: number;
}

export interface FlashcardsPage {
  items: DueFlashcard[];
  total: number;
}

export type FlashcardFilterCounts = Record<FlashcardListFilter, number>;

export interface CardScheduleRepository {
  create(flashcardId: string, schedule: ScheduleSnapshot): Promise<void>;
  findByFlashcardId(flashcardId: string): Promise<CardSchedule | null>;
  update(flashcardId: string, schedule: ScheduleSnapshot): Promise<void>;
  listDueForUser(userId: string, now: Date): Promise<DueFlashcard[]>;
  listByFlashcardIds(flashcardIds: string[]): Promise<CardSchedule[]>;
  /** Tela de Flashcards (seção 9 do CLAUDE.md): uma página por vez, nunca a lista inteira. */
  listByUserPaged(input: ListFlashcardsPageInput): Promise<FlashcardsPage>;
  countByUserForEachFilter(userId: string, now: Date): Promise<FlashcardFilterCounts>;
}
