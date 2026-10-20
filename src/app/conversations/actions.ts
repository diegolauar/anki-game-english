"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { StartConversation } from "@/application/use-cases/start-conversation";
import { SendMessage, type SendMessageResult } from "@/application/use-cases/send-message";
import { FinishConversation } from "@/application/use-cases/finish-conversation";
import { AnalyzeConversation } from "@/application/use-cases/analyze-conversation";
import { DIFFICULTIES } from "@/domain/value-objects/difficulty";
import { logError } from "@/lib/logger";
import { INPUT_MODES } from "@/domain/value-objects/input-mode";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";
import { SupabaseAnalysisRepository } from "@/infrastructure/supabase/analysis-repository";
import { SupabaseAnalysisWriter } from "@/infrastructure/supabase/analysis-writer";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseFindingWriter } from "@/infrastructure/supabase/finding-writer";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";
import { SupabaseLearningPointWriter } from "@/infrastructure/supabase/learning-point-writer";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseSpeechTranscriptionRepository } from "@/infrastructure/supabase/speech-transcription-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";
import { SupabaseDailyUsageRepository } from "@/infrastructure/supabase/daily-usage-repository";
import { SupabaseRateLimitRepository } from "@/infrastructure/supabase/rate-limit-repository";
import { SupabaseXpEventWriter } from "@/infrastructure/supabase/xp-event-writer";
import { SupabaseLlmUsageRepository } from "@/infrastructure/supabase/llm-usage-repository";
import { OpenAiConversationAgent } from "@/infrastructure/llm/openai-conversation-agent";
import { OpenAiAnalysisAgent } from "@/infrastructure/llm/openai-analysis-agent";

/**
 * analyses, findings e learning_points só têm policy de RLS para SELECT — a
 * escrita é feita pelo service role (ver migração inicial). O tipo
 * `ServiceRoleSupabaseClient` garante isso em tempo de compilação: os
 * escritores (`*Writer`) só aceitam esse cliente, então não dá para chamar
 * esta função com o cliente de sessão por engano. Quando ela é chamada, o
 * analysisId já foi validado contra o dono pela camada que a invoca (usando
 * o cliente da sessão do usuário).
 */
function buildAnalyzeConversation(
  serviceRoleClient: ServiceRoleSupabaseClient,
  userId: string,
): AnalyzeConversation {
  return new AnalyzeConversation(
    new SupabaseAnalysisRepository(serviceRoleClient),
    new SupabaseAnalysisWriter(serviceRoleClient),
    new SupabaseConversationRepository(serviceRoleClient),
    new SupabaseMessageRepository(serviceRoleClient),
    new SupabaseLearningPointRepository(serviceRoleClient),
    new SupabaseLearningPointWriter(serviceRoleClient),
    new SupabaseFindingWriter(serviceRoleClient),
    new SupabaseFlashcardRepository(serviceRoleClient),
    new OpenAiAnalysisAgent({
      userId,
      usageRepository: new SupabaseLlmUsageRepository(serviceRoleClient),
    }),
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

  const rawMode = formData.get("mode");
  const mode = rawMode === "voice" ? "voice" : "text";

  const useCase = new StartConversation(new SupabaseConversationRepository(supabase));
  const conversation = await useCase.execute({ userId: user.id, ...input });

  redirect(`/conversations/${conversation.id}?mode=${mode}`);
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
    new OpenAiConversationAgent({
      userId: user.id,
      usageRepository: new SupabaseLlmUsageRepository(createSupabaseServiceRoleClient()),
    }),
    new SupabaseSpeechTranscriptionRepository(supabase),
    new SupabaseUserProfileRepository(supabase),
    new SupabaseDailyUsageRepository(supabase),
    new SupabaseRateLimitRepository(supabase),
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

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const finishConversation = new FinishConversation(
    new SupabaseConversationRepository(supabase),
    new SupabaseAnalysisWriter(serviceRoleClient),
    new SupabaseMessageRepository(supabase),
    new SupabaseXpEventWriter(serviceRoleClient),
  );
  const { analysisId } = await finishConversation.execute({
    conversationId: parsed.conversationId,
    userId: user.id,
  });

  // A análise (chamada de LLM, 6-8s) roda depois da resposta HTTP ser enviada
  // — o usuário não espera por ela, e o request não arrisca estourar o tempo
  // limite de uma function serverless (seção 11 do CLAUDE.md: a conversa nunca
  // pode ser perdida por falha de análise). A tela de Resultados faz polling
  // enquanto o status for pending/processing e tem "tentar novamente" se falhar.
  after(async () => {
    try {
      await buildAnalyzeConversation(serviceRoleClient, user.id).execute(analysisId);
    } catch (error) {
      // O use case já marcou a analysis como failed; a tela de resultados mostra
      // esse estado e oferece "tentar novamente". Registramos aqui só para
      // observabilidade (hoje isso não gerava log nenhum).
      logError("analyze_conversation_failed", { analysisId, userId: user.id }, error);
    }
  });

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

  const serviceRoleClient = createSupabaseServiceRoleClient();
  after(async () => {
    try {
      await buildAnalyzeConversation(serviceRoleClient, user.id).execute(parsed.analysisId);
    } catch (error) {
      logError(
        "analyze_conversation_failed",
        { analysisId: parsed.analysisId, userId: user.id, retry: true },
        error,
      );
    }
  });

  revalidatePath(`/conversations/${conversation.id}/results`);
}
