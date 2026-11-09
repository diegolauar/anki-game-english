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
    const [messageResult, voiceResult, finishedResult] = await Promise.all([
      this.client
        .from("user_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "user")
        .gte("created_at", todayStartIso),
      this.client
        .from("user_messages")
        .select("audio_duration_ms")
        .eq("user_id", userId)
        .eq("role", "user")
        .eq("input_mode", "voice")
        .gte("created_at", todayStartIso),
      this.client
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "finished")
        .gte("ended_at", todayStartIso),
    ]);
    if (messageResult.error) throw messageResult.error;
    if (voiceResult.error) throw voiceResult.error;
    if (finishedResult.error) throw finishedResult.error;

    const totalMs = voiceResult.data.reduce((sum, row) => sum + (row.audio_duration_ms ?? 0), 0);

    return {
      messageCount: messageResult.count ?? 0,
      voiceMinutes: totalMs / 60_000,
      conversationsFinished: finishedResult.count ?? 0,
    };
  }
}
