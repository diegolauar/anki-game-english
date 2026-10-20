"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { StartConversation } from "@/application/use-cases/start-conversation";
import { SendMessage, type SendMessageResult } from "@/application/use-cases/send-message";
import { DIFFICULTIES } from "@/domain/value-objects/difficulty";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { OpenAiConversationAgent } from "@/infrastructure/llm/openai-conversation-agent";

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

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
  clientMessageId: z.string().min(1),
});

export async function sendMessageAction(input: {
  conversationId: string;
  content: string;
  clientMessageId: string;
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
  );

  const result = await useCase.execute({
    conversationId: parsed.conversationId,
    userId: user.id,
    content: parsed.content,
    inputMode: "text",
    clientMessageId: parsed.clientMessageId,
  });

  revalidatePath(`/conversations/${parsed.conversationId}`);
  return result;
}
