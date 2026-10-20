import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyUsage, DailyUsageRepository } from "@/domain/ports/daily-usage-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

function startOfTodayUtcIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export class SupabaseDailyUsageRepository implements DailyUsageRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getTodayUsage(userId: string): Promise<DailyUsage> {
    const todayStartIso = startOfTodayUtcIso();

    // `user_messages` (ver migração 20261020180000) já junta messages com o
    // user_id da conversa e a duração do áudio — uma consulta em vez de
    // buscar conversas, depois mensagens, depois transcrições.
    const { count: messageCount, error: messageError } = await this.client
      .from("user_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", todayStartIso);
    if (messageError) throw messageError;

    const { data: voiceRows, error: voiceError } = await this.client
      .from("user_messages")
      .select("audio_duration_ms")
      .eq("user_id", userId)
      .eq("role", "user")
      .eq("input_mode", "voice")
      .gte("created_at", todayStartIso);
    if (voiceError) throw voiceError;

    const totalMs = voiceRows.reduce((sum, row) => sum + (row.audio_duration_ms ?? 0), 0);

    return { messageCount: messageCount ?? 0, voiceMinutes: totalMs / 60_000 };
  }
}
