import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GetDashboard } from "@/application/use-cases/get-dashboard";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const getDashboard = new GetDashboard(
    new SupabaseUserProfileRepository(supabase),
    new SupabaseTopicRepository(supabase),
  );
  const { profile, topics } = await getDashboard.execute(user.id);

  return (
    <main className="mx-auto max-w-3xl flex-1 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Olá, {profile?.displayName ?? user.email}
        </h1>
        <form action="/auth/sign-out" method="post">
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Temas para conversar</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.id} className="rounded-lg border p-4">
              <p className="font-medium">{topic.title}</p>
              {topic.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
