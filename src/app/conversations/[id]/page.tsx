import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChatView } from "@/components/chat-view";
import { getTypedLocale } from "@/i18n/get-locale";
import { buildDifficultyLabels } from "@/lib/difficulty-labels";
import type { InputMode } from "@/domain/value-objects/input-mode";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const [t, tDifficulty, locale] = await Promise.all([
    getTranslations("conversation"),
    getTranslations("difficulty"),
    getTypedLocale(),
  ]);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const conversation = await new SupabaseConversationRepository(supabase).findById(id);
  if (!conversation || conversation.userId !== user.id) notFound();

  if (conversation.status !== "active") {
    redirect(`/conversations/${id}/results`);
  }

  const messages = await new SupabaseMessageRepository(supabase).listByConversation(id);

  let topicTitle = conversation.customTopic;
  let topicSlug: string | null = null;
  if (!topicTitle && conversation.topicId) {
    const topic = await new SupabaseTopicRepository(supabase).findById(conversation.topicId, locale);
    topicTitle = topic?.title ?? null;
    topicSlug = topic?.slug ?? null;
  }

  return (
    <ChatView
      conversationId={conversation.id}
      initialMessages={messages}
      topicTitle={topicTitle ?? t("defaultTitle")}
      topicSlug={topicSlug}
      difficultyLabel={buildDifficultyLabels(tDifficulty)[conversation.difficulty]}
      startedAt={conversation.startedAt}
      initialMode={mode === "voice" ? "voice" : ("text" as InputMode)}
    />
  );
}
