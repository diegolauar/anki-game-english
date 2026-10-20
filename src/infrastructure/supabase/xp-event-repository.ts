import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyXpTotal, XpEventRepository } from "@/domain/ports/xp-event-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseXpEventRepository implements XpEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

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
