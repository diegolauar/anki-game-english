import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimitRepository } from "@/domain/ports/rate-limit-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseRateLimitRepository implements RateLimitRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async countRecentUserMessages(userId: string, since: Date): Promise<number> {
    const { data: conversationRows, error: conversationError } = await this.client
      .from("conversations")
      .select("id")
      .eq("user_id", userId);
    if (conversationError) throw conversationError;

    const conversationIds = conversationRows.map((row) => row.id);
    if (conversationIds.length === 0) return 0;

    const { count, error } = await this.client
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .in("conversation_id", conversationIds)
      .gte("created_at", since.toISOString());
    if (error) throw error;

    return count ?? 0;
  }
}
