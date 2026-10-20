import { NextResponse } from "next/server";
import { OpenAiWhisperSpeechToText } from "@/infrastructure/stt/openai-whisper-speech-to-text";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { logError } from "@/lib/logger";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio file is too large." }, { status: 413 });
  }

  const buffer = Buffer.from(await audio.arrayBuffer());

  try {
    const speechToText = new OpenAiWhisperSpeechToText();
    const result = await speechToText.transcribe({
      audio: buffer,
      mimeType: audio.type || "audio/webm",
    });

    return NextResponse.json(result);
  } catch (error) {
    logError("speech_to_text_failed", { userId: user.id }, error);
    return NextResponse.json({ error: "Transcription failed." }, { status: 502 });
  }
}
