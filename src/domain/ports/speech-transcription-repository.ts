import type { SpeechTranscription } from "@/domain/entities/speech-transcription";

export interface CreateSpeechTranscriptionInput {
  messageId: string;
  rawText: string;
  provider: string;
  audioDurationMs: number | null;
}

export interface SpeechTranscriptionRepository {
  create(input: CreateSpeechTranscriptionInput): Promise<SpeechTranscription>;
}
