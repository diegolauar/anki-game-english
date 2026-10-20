import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Flame, LogOut, MessageCirclePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicIcon } from "@/components/topic-icon";
import { GetDashboard } from "@/application/use-cases/get-dashboard";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";
import { SupabaseXpEventRepository } from "@/infrastructure/supabase/xp-event-repository";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const getDashboard = new GetDashboard(
    new SupabaseUserProfileRepository(supabase),
    new SupabaseTopicRepository(supabase),
    new SupabaseCardScheduleRepository(supabase),
    new SupabaseXpEventRepository(supabase),
  );
  const { profile, topics, pendingReviewCount, totalXp, streak } = await getDashboard.execute(
    user.id,
  );

  return (
    <main className="mx-auto max-w-3xl flex-1 p-6 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {profile?.displayName ?? user.email}</h1>
          <div className="mt-2 flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Star className="size-3.5 fill-current" />
              {totalXp} XP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-sm font-medium text-orange-600 dark:text-orange-400">
              <Flame className="size-3.5 fill-current" />
              {streak} {streak === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            render={
              <Link href="/conversations/new">
                <MessageCirclePlus />
                Nova conversa
              </Link>
            }
            nativeButton={false}
          />
          <Button
            render={
              <Link href="/review">
                <BookOpen />
                Revisar flashcards ({pendingReviewCount})
              </Link>
            }
            nativeButton={false}
            variant="outline"
          />
          <form action="/auth/sign-out" method="post">
            <Button type="submit" variant="ghost" size="icon" aria-label="Sair">
              <LogOut />
            </Button>
          </form>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Temas para conversar</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/conversations/new?topicId=${topic.id}`}
                className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <TopicIcon category={topic.category} />
                <span>
                  <span className="block font-medium">{topic.title}</span>
                  {topic.description && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {topic.description}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
