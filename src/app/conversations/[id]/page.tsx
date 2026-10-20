import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import { finishConversationAction } from "@/app/conversations/actions";
import { Button } from "@/components/ui/button";
import { ChatView } from "@/components/chat-view";
import { TopicIcon } from "@/components/topic-icon";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  let topicCategory: string | null = null;
  if (!topicTitle && conversation.topicId) {
    const topic = await new SupabaseTopicRepository(supabase).findById(conversation.topicId);
    topicTitle = topic?.title ?? null;
    topicCategory = topic?.category ?? null;
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-1 flex-col p-4">
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/dashboard"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Voltar ao dashboard"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <TopicIcon category={topicCategory} />
          <h1 className="truncate text-lg font-semibold">{topicTitle ?? "Conversa"}</h1>
        </div>
        <form action={finishConversationAction}>
          <input type="hidden" name="conversationId" value={conversation.id} />
          <Button type="submit" variant="outline" size="sm">
            <Flag />
            Finish conversation
          </Button>
        </form>
      </div>
      <ChatView conversationId={conversation.id} initialMessages={messages} />
    </main>
  );
}
