import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChatView } from "@/components/chat-view";
import { getTypedLocale } from "@/i18n/get-locale";
import { buildDifficultyLabels } from "@/lib/difficulty-labels";
import type { InputMode } from "@/domain/value-objects/input-mode";
import { requireActiveSubscription } from "@/infrastructure/supabase/require-active-subscription";
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

  const { supabase, user } = await requireActiveSubscription();

  const [conversation, messages] = await Promise.all([
    new SupabaseConversationRepository(supabase).findById(id),
    new SupabaseMessageRepository(supabase).listByConversation(id),
  ]);
  if (!conversation || conversation.userId !== user.id) notFound();

  if (conversation.status !== "active") {
    redirect(`/conversations/${id}/results`);
  }

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
