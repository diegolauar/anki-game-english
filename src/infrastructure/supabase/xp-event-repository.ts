import type { SupabaseClient } from "@supabase/supabase-js";
import type { XpEvent } from "@/domain/entities/xp-event";
import type {
  CreateXpEventInput,
  DailyXpTotal,
  XpEventRepository,
} from "@/domain/ports/xp-event-repository";
import type { XpSourceType } from "@/domain/value-objects/xp-source-type";
import type { Database } from "@/infrastructure/supabase/database.types";

const UNIQUE_VIOLATION = "23505";

type XpEventRow = Pick<
  Database["public"]["Tables"]["xp_events"]["Row"],
  "id" | "user_id" | "source_type" | "source_id" | "amount" | "created_at"
>;

function toXpEvent(row: XpEventRow): XpEvent {
  return {
    id: row.id,
    userId: row.user_id,
    sourceType: row.source_type as XpSourceType,
    sourceId: row.source_id,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export class SupabaseXpEventRepository implements XpEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateXpEventInput): Promise<XpEvent | null> {
    const { data, error } = await this.client
      .from("xp_events")
      .insert({
        user_id: input.userId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        amount: input.amount,
      })
      .select("id, user_id, source_type, source_id, amount, created_at")
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) return null;
      throw error;
    }
    return toXpEvent(data);
  }

  async sumByUser(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from("xp_events")
      .select("amount")
      .eq("user_id", userId);

    if (error) throw error;
    return data.reduce((sum, row) => sum + row.amount, 0);
  }

  async listActiveDateKeysByUser(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("xp_events")
      .select("created_at")
      .eq("user_id", userId);

    if (error) throw error;

    const dateKeys = new Set(data.map((row) => row.created_at.slice(0, 10)));
    return [...dateKeys];
  }

  async listDailyTotalsByUser(userId: string, since: Date): Promise<DailyXpTotal[]> {
    const { data, error } = await this.client
      .from("xp_events")
      .select("created_at, amount")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString());

    if (error) throw error;

    const totals = new Map<string, number>();
    for (const row of data) {
      const dateKey = row.created_at.slice(0, 10);
      totals.set(dateKey, (totals.get(dateKey) ?? 0) + row.amount);
    }
    return [...totals.entries()].map(([dateKey, amount]) => ({ dateKey, amount }));
  }
}
