import OpenAI, { toFile } from "openai";
import type {
  SpeechToText,
  TranscribeAudioInput,
  TranscribeAudioResult,
} from "@/domain/ports/speech-to-text";

const PROVIDER_NAME = "openai-whisper";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
};

function guessExtension(mimeType: string): string {
  const base = mimeType.split(";")[0].trim();
  return EXTENSION_BY_MIME_TYPE[base] ?? "webm";
}

export class OpenAiWhisperSpeechToText implements SpeechToText {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.STT_API_KEY;
    if (!apiKey) throw new Error("STT_API_KEY is not set.");

    this.client = new OpenAI({ apiKey });
  }

  async transcribe(input: TranscribeAudioInput): Promise<TranscribeAudioResult> {
    // O nome do arquivo precisa ter uma extensão reconhecível — a API do
    // Whisper identifica o formato pelo nome, não só pelo header `type`.
    const filename = `audio.${guessExtension(input.mimeType)}`;
    const file = await toFile(input.audio, filename, { type: input.mimeType });

    // Sem `prompt`: whisper-1 tende a ser mais literal que os modelos de
    // transcrição mais novos baseados em chat, e um prompt de estilo poderia
    // enviesá-lo a "corrigir" o erro gramatical que a Fase 3 precisa detectar.
    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "json",
    });

    return { text: transcription.text, provider: PROVIDER_NAME };
  }
}
