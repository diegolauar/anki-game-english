import { NextResponse } from "next/server";
import { hasActiveAccess } from "@/domain/value-objects/subscription-status";
import { getDailyVoiceMinutesLimit } from "@/domain/rules/daily-limits";
import { OpenAiWhisperSpeechToText } from "@/infrastructure/stt/openai-whisper-speech-to-text";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseDailyUsageRepository } from "@/infrastructure/supabase/daily-usage-repository";
import { SupabaseSubscriptionRepository } from "@/infrastructure/supabase/subscription-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";
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

  const subscription = await new SupabaseSubscriptionRepository(supabase).getByUserId(user.id);
  if (!subscription || !hasActiveAccess(subscription.status)) {
    return NextResponse.json({ error: "Subscription required." }, { status: 403 });
  }

  const [profile, usage] = await Promise.all([
    new SupabaseUserProfileRepository(supabase).getById(user.id),
    new SupabaseDailyUsageRepository(supabase).getTodayUsage(user.id),
  ]);
  const voiceMinutesLimit = getDailyVoiceMinutesLimit(profile?.preferences ?? {});
  if (usage.voiceMinutes >= voiceMinutesLimit) {
    return NextResponse.json({ error: "Daily voice limit reached." }, { status: 429 });
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
