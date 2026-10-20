export interface TranscribeAudioInput {
  audio: Buffer;
  mimeType: string;
}

export interface TranscribeAudioResult {
  text: string;
  provider: string;
}

export interface SpeechToText {
  transcribe(input: TranscribeAudioInput): Promise<TranscribeAudioResult>;
}
