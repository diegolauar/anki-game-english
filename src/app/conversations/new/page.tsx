import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewConversationForm } from "@/components/new-conversation-form";
import { requireUser } from "@/infrastructure/supabase/require-user";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string }>;
}) {
  const { topicId: preselectedTopicId } = await searchParams;

  const { supabase, user } = await requireUser();

  const [topics, profile] = await Promise.all([
    new SupabaseTopicRepository(supabase).listActive(),
    new SupabaseUserProfileRepository(supabase).getById(user.id),
  ]);

  return (
    <main className="mx-auto max-w-[1120px] flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Início
      </Link>
      <h1 className="mt-2 font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
        Nova conversa
      </h1>

      <NewConversationForm
        topics={topics}
        defaultDifficulty={profile?.targetLevel ?? "beginner"}
        preselectedTopicId={preselectedTopicId ?? null}
      />
    </main>
  );
}
