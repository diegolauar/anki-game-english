import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpeechTranscription } from "@/domain/entities/speech-transcription";
import type {
  CreateSpeechTranscriptionInput,
  SpeechTranscriptionRepository,
} from "@/domain/ports/speech-transcription-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

type SpeechTranscriptionRow = Pick<
  Database["public"]["Tables"]["speech_transcriptions"]["Row"],
  "id" | "message_id" | "raw_text" | "provider" | "audio_duration_ms" | "created_at"
>;

const SPEECH_TRANSCRIPTION_COLUMNS = "id, message_id, raw_text, provider, audio_duration_ms, created_at";

function toSpeechTranscription(row: SpeechTranscriptionRow): SpeechTranscription {
  return {
    id: row.id,
    messageId: row.message_id,
    rawText: row.raw_text,
    provider: row.provider,
    audioDurationMs: row.audio_duration_ms,
    createdAt: row.created_at,
  };
}

export class SupabaseSpeechTranscriptionRepository implements SpeechTranscriptionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateSpeechTranscriptionInput): Promise<SpeechTranscription> {
    const { data, error } = await this.client
      .from("speech_transcriptions")
      .insert({
        message_id: input.messageId,
        raw_text: input.rawText,
        provider: input.provider,
        audio_duration_ms: input.audioDurationMs,
      })
      .select(SPEECH_TRANSCRIPTION_COLUMNS)
      .single();

    if (error) throw error;
    return toSpeechTranscription(data);
  }
}
