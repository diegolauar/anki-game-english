import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardSchedule, ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { CardScheduleRepository, DueFlashcard } from "@/domain/ports/card-schedule-repository";
import type { CardState } from "@/domain/value-objects/card-state";
import type { Database } from "@/infrastructure/supabase/database.types";
import { FLASHCARD_COLUMNS, toFlashcard } from "@/infrastructure/supabase/flashcard-repository";

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
    const { data: flashcardRows, error: flashcardError } = await this.client
      .from("flashcards")
      .select(FLASHCARD_COLUMNS)
      .eq("user_id", userId)
      .eq("status", "active");

    if (flashcardError) throw flashcardError;
    if (flashcardRows.length === 0) return [];

    const { data: scheduleRows, error: scheduleError } = await this.client
      .from("card_schedules")
      .select(SCHEDULE_COLUMNS)
      .in(
        "flashcard_id",
        flashcardRows.map((row) => row.id),
      )
      .lte("due_at", now.toISOString());

    if (scheduleError) throw scheduleError;

    const scheduleByFlashcardId = new Map(scheduleRows.map((row) => [row.flashcard_id, row]));

    const due: DueFlashcard[] = [];
    for (const flashcardRow of flashcardRows) {
      const scheduleRow = scheduleByFlashcardId.get(flashcardRow.id);
      if (!scheduleRow) continue;
      due.push({ flashcard: toFlashcard(flashcardRow), schedule: toCardSchedule(scheduleRow) });
    }
    return due;
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
