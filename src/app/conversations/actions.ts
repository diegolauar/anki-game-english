"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StartConversation } from "@/application/use-cases/start-conversation";
import { SendMessage, type SendMessageResult } from "@/application/use-cases/send-message";
import { FinishConversation } from "@/application/use-cases/finish-conversation";
import { AnalyzeConversation } from "@/application/use-cases/analyze-conversation";
import { DIFFICULTIES } from "@/domain/value-objects/difficulty";
import { INPUT_MODES } from "@/domain/value-objects/input-mode";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseAnalysisRepository } from "@/infrastructure/supabase/analysis-repository";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseFindingRepository } from "@/infrastructure/supabase/finding-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseSpeechTranscriptionRepository } from "@/infrastructure/supabase/speech-transcription-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { OpenAiConversationAgent } from "@/infrastructure/llm/openai-conversation-agent";
import { OpenAiAnalysisAgent } from "@/infrastructure/llm/openai-analysis-agent";
import type { Database } from "@/infrastructure/supabase/database.types";

function buildAnalyzeConversation(supabase: SupabaseClient<Database>): AnalyzeConversation {
  return new AnalyzeConversation(
    new SupabaseAnalysisRepository(supabase),
    new SupabaseConversationRepository(supabase),
    new SupabaseMessageRepository(supabase),
    new SupabaseLearningPointRepository(supabase),
    new SupabaseFindingRepository(supabase),
    new SupabaseFlashcardRepository(supabase),
    new OpenAiAnalysisAgent(),
  );
}

const startConversationSchema = z.object({
  topicId: z.string().uuid().nullable(),
  customTopic: z.string().trim().min(1).nullable(),
  difficulty: z.enum(DIFFICULTIES),
});

export async function startConversationAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rawCustomTopic = formData.get("customTopic");
  const customTopic =
    typeof rawCustomTopic === "string" && rawCustomTopic.trim().length > 0
      ? rawCustomTopic.trim()
      : null;

  const rawTopicId = formData.get("topicId");
  const topicId =
    !customTopic && typeof rawTopicId === "string" && rawTopicId.length > 0
      ? rawTopicId
      : null;

  const input = startConversationSchema.parse({
    topicId,
    customTopic,
    difficulty: formData.get("difficulty"),
  });

  const useCase = new StartConversation(new SupabaseConversationRepository(supabase));
  const conversation = await useCase.execute({ userId: user.id, ...input });

  redirect(`/conversations/${conversation.id}`);
}

const voiceTranscriptionSchema = z.object({
  rawText: z.string().min(1),
  provider: z.string().min(1),
  audioDurationMs: z.number().int().positive().nullable(),
});

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
  clientMessageId: z.string().min(1),
  inputMode: z.enum(INPUT_MODES).default("text"),
  voiceTranscription: voiceTranscriptionSchema.optional(),
});

export async function sendMessageAction(input: {
  conversationId: string;
  content: string;
  clientMessageId: string;
  inputMode?: "text" | "voice";
  voiceTranscription?: { rawText: string; provider: string; audioDurationMs: number | null };
}): Promise<SendMessageResult> {
  const parsed = sendMessageSchema.parse(input);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const useCase = new SendMessage(
    new SupabaseConversationRepository(supabase),
    new SupabaseMessageRepository(supabase),
    new SupabaseTopicRepository(supabase),
    new OpenAiConversationAgent(),
    new SupabaseSpeechTranscriptionRepository(supabase),
  );

  const result = await useCase.execute({
    conversationId: parsed.conversationId,
    userId: user.id,
    content: parsed.content,
    inputMode: parsed.inputMode,
    clientMessageId: parsed.clientMessageId,
    voiceTranscription: parsed.voiceTranscription,
  });

  revalidatePath(`/conversations/${parsed.conversationId}`);
  return result;
}

const finishConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export async function finishConversationAction(formData: FormData) {
  const parsed = finishConversationSchema.parse({
    conversationId: formData.get("conversationId"),
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const finishConversation = new FinishConversation(
    new SupabaseConversationRepository(supabase),
    new SupabaseAnalysisRepository(supabase),
  );
  const { analysisId } = await finishConversation.execute({
    conversationId: parsed.conversationId,
    userId: user.id,
  });

  try {
    await buildAnalyzeConversation(supabase).execute(analysisId);
  } catch {
    // Já registrado como failed pelo use case; a tela de resultados mostra o estado de erro.
  }

  redirect(`/conversations/${parsed.conversationId}/results`);
}

const retryAnalysisSchema = z.object({
  analysisId: z.string().uuid(),
});

export async function retryAnalysisAction(formData: FormData) {
  const parsed = retryAnalysisSchema.parse({ analysisId: formData.get("analysisId") });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const analysisRepository = new SupabaseAnalysisRepository(supabase);
  const analysis = await analysisRepository.findById(parsed.analysisId);
  if (!analysis) throw new Error("Analysis not found.");

  const conversation = await new SupabaseConversationRepository(supabase).findById(
    analysis.conversationId,
  );
  if (!conversation || conversation.userId !== user.id) throw new Error("Not authorized.");

  try {
    await buildAnalyzeConversation(supabase).execute(parsed.analysisId);
  } catch {
    // Já registrado como failed pelo use case; a tela de resultados mostra o estado de erro.
  }

  revalidatePath(`/conversations/${conversation.id}/results`);
}
