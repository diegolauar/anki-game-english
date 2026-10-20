import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewLog } from "@/domain/entities/review-log";
import type { CreateReviewLogInput, ReviewLogRepository } from "@/domain/ports/review-log-repository";
import type { CardState } from "@/domain/value-objects/card-state";
import type { Rating } from "@/domain/value-objects/rating";
import type { Database } from "@/infrastructure/supabase/database.types";

type ReviewLogRow = Pick<
  Database["public"]["Tables"]["review_logs"]["Row"],
  | "id"
  | "flashcard_id"
  | "user_id"
  | "rating"
  | "state_before"
  | "elapsed_days"
  | "scheduled_days"
  | "reviewed_at"
>;

const REVIEW_LOG_COLUMNS =
  "id, flashcard_id, user_id, rating, state_before, elapsed_days, scheduled_days, reviewed_at";

function toReviewLog(row: ReviewLogRow): ReviewLog {
  return {
    id: row.id,
    flashcardId: row.flashcard_id,
    userId: row.user_id,
    rating: row.rating as Rating,
    stateBefore: row.state_before as CardState,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    reviewedAt: row.reviewed_at,
  };
}

export class SupabaseReviewLogRepository implements ReviewLogRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateReviewLogInput): Promise<ReviewLog> {
    const { data, error } = await this.client
      .from("review_logs")
      .insert({
        flashcard_id: input.flashcardId,
        user_id: input.userId,
        rating: input.rating,
        state_before: input.stateBefore,
        elapsed_days: input.elapsedDays,
        scheduled_days: input.scheduledDays,
      })
      .select(REVIEW_LOG_COLUMNS)
      .single();

    if (error) throw error;
    return toReviewLog(data);
  }

  async countTodayByUser(userId: string, now: Date): Promise<number> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await this.client
      .from("review_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("reviewed_at", startOfDay.toISOString());

    if (error) throw error;
    return count ?? 0;
  }
}
