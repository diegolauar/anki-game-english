import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimitRepository } from "@/domain/ports/rate-limit-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseRateLimitRepository implements RateLimitRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async countRecentUserMessages(userId: string, since: Date): Promise<number> {
    // `user_messages` (ver migração 20261020180000) já traz o user_id da
    // conversa — uma consulta em vez de buscar as conversas do usuário primeiro.
    const { count, error } = await this.client
      .from("user_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", since.toISOString());
    if (error) throw error;

    return count ?? 0;
  }
}
