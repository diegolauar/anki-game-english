import type { SupabaseClient } from "@supabase/supabase-js";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { CardSchedule, ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { CardScheduleRepository, DueFlashcard } from "@/domain/ports/card-schedule-repository";
import type { CardType } from "@/domain/value-objects/card-type";
import type { CardState } from "@/domain/value-objects/card-state";
import type { FlashcardStatus } from "@/domain/value-objects/flashcard-status";
import type { Database } from "@/infrastructure/supabase/database.types";

const FLASHCARD_WITH_SCHEDULE_COLUMNS =
  "id, user_id, learning_point_id, source_finding_id, card_type, front, back, explanation, status, created_at, updated_at, due_at, stability, difficulty, reps, lapses, state, last_reviewed_at";

type FlashcardWithScheduleRow =
  Database["public"]["Views"]["flashcards_with_schedule"]["Row"];

function toDueFlashcard(row: FlashcardWithScheduleRow): DueFlashcard {
  const flashcard: Flashcard = {
    id: row.id!,
    userId: row.user_id!,
    learningPointId: row.learning_point_id,
    sourceFindingId: row.source_finding_id,
    cardType: row.card_type as CardType,
    front: row.front!,
    back: row.back!,
    explanation: row.explanation,
    status: row.status as FlashcardStatus,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
  const schedule: CardSchedule = {
    flashcardId: row.id!,
    dueAt: row.due_at!,
    stability: row.stability!,
    difficulty: row.difficulty!,
    reps: row.reps!,
    lapses: row.lapses!,
    state: row.state as CardState,
    lastReviewedAt: row.last_reviewed_at,
  };
  return { flashcard, schedule };
}

type ScheduleRow = Pick<
  Database["public"]["Tables"]["card_schedules"]["Row"],
  | "flashcard_id"
  | "due_at"
  | "stability"
  | "difficulty"
  | "reps"
  | "lapses"
  | "state"
  | "last_reviewed_at"
>;

const SCHEDULE_COLUMNS =
  "flashcard_id, due_at, stability, difficulty, reps, lapses, state, last_reviewed_at";

function toCardSchedule(row: ScheduleRow): CardSchedule {
  return {
    flashcardId: row.flashcard_id,
    dueAt: row.due_at,
    stability: row.stability,
    difficulty: row.difficulty,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as CardState,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export class SupabaseCardScheduleRepository implements CardScheduleRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(flashcardId: string, schedule: ScheduleSnapshot): Promise<void> {
    const { error } = await this.client.from("card_schedules").insert({
      flashcard_id: flashcardId,
      due_at: schedule.dueAt,
      stability: schedule.stability,
      difficulty: schedule.difficulty,
      reps: schedule.reps,
      lapses: schedule.lapses,
      state: schedule.state,
      last_reviewed_at: schedule.lastReviewedAt,
    });

    if (error) throw error;
  }

  async findByFlashcardId(flashcardId: string): Promise<CardSchedule | null> {
    const { data, error } = await this.client
      .from("card_schedules")
      .select(SCHEDULE_COLUMNS)
      .eq("flashcard_id", flashcardId)
      .maybeSingle();

    if (error) throw error;
    return data ? toCardSchedule(data) : null;
  }

  async update(flashcardId: string, schedule: ScheduleSnapshot): Promise<void> {
    const { error } = await this.client
      .from("card_schedules")
      .update({
        due_at: schedule.dueAt,
        stability: schedule.stability,
        difficulty: schedule.difficulty,
        reps: schedule.reps,
        lapses: schedule.lapses,
        state: schedule.state,
        last_reviewed_at: schedule.lastReviewedAt,
      })
      .eq("flashcard_id", flashcardId);

    if (error) throw error;
  }

  async listDueForUser(userId: string, now: Date): Promise<DueFlashcard[]> {
    // `flashcards_with_schedule` (ver migração 20261020180000) já junta as
    // duas tabelas — uma consulta em vez de buscar os flashcards do usuário e
    // depois os schedules correspondentes para juntar em memória.
    const { data, error } = await this.client
      .from("flashcards_with_schedule")
      .select(FLASHCARD_WITH_SCHEDULE_COLUMNS)
      .eq("user_id", userId)
      .eq("status", "active")
      .lte("due_at", now.toISOString());

    if (error) throw error;
    return data.map(toDueFlashcard);
  }

  async listByFlashcardIds(flashcardIds: string[]): Promise<CardSchedule[]> {
    if (flashcardIds.length === 0) return [];

    const { data, error } = await this.client
      .from("card_schedules")
      .select(SCHEDULE_COLUMNS)
      .in("flashcard_id", flashcardIds);

    if (error) throw error;
    return data.map(toCardSchedule);
  }
}
