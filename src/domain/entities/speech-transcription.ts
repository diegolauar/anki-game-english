export interface SpeechTranscription {
  id: string;
  messageId: string;
  rawText: string;
  provider: string;
  audioDurationMs: number | null;
  createdAt: string;
}
