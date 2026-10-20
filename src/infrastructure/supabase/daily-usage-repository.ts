import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyUsage, DailyUsageRepository } from "@/domain/ports/daily-usage-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

function startOfTodayIso(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export class SupabaseDailyUsageRepository implements DailyUsageRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getTodayUsage(userId: string): Promise<DailyUsage> {
    const todayStartIso = startOfTodayIso();

    const { data: conversationRows, error: conversationError } = await this.client
      .from("conversations")
      .select("id")
      .eq("user_id", userId);
    if (conversationError) throw conversationError;

    const conversationIds = conversationRows.map((row) => row.id);
    if (conversationIds.length === 0) return { messageCount: 0, voiceMinutes: 0 };

    const { count: messageCount, error: messageError } = await this.client
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .in("conversation_id", conversationIds)
      .gte("created_at", todayStartIso);
    if (messageError) throw messageError;

    const { data: voiceMessageRows, error: voiceMessageError } = await this.client
      .from("messages")
      .select("id")
      .eq("role", "user")
      .eq("input_mode", "voice")
      .in("conversation_id", conversationIds)
      .gte("created_at", todayStartIso);
    if (voiceMessageError) throw voiceMessageError;

    let voiceMinutes = 0;
    if (voiceMessageRows.length > 0) {
      const { data: transcriptionRows, error: transcriptionError } = await this.client
        .from("speech_transcriptions")
        .select("audio_duration_ms")
        .in(
          "message_id",
          voiceMessageRows.map((row) => row.id),
        );
      if (transcriptionError) throw transcriptionError;

      const totalMs = transcriptionRows.reduce(
        (sum, row) => sum + (row.audio_duration_ms ?? 0),
        0,
      );
      voiceMinutes = totalMs / 60_000;
    }

    return { messageCount: messageCount ?? 0, voiceMinutes };
  }
}
