import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <main className="mx-auto max-w-3xl flex-1 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Olá, {profile?.displayName ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalXp} XP · {streak} {streak === 1 ? "dia" : "dias"} de sequência
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/conversations/new">Nova conversa</Link>} />
          <Button
            render={<Link href="/review">Revisar flashcards ({pendingReviewCount})</Link>}
            variant="outline"
          />
          <form action="/auth/sign-out" method="post">
            <Button type="submit" variant="outline">
              Sair
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
                className="block rounded-lg border p-4 transition-colors hover:border-primary"
              >
                <p className="font-medium">{topic.title}</p>
                {topic.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {topic.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
