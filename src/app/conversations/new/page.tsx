import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageCirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopicIcon } from "@/components/topic-icon";
import { startConversationAction } from "@/app/conversations/actions";
import { DIFFICULTIES, type Difficulty } from "@/domain/value-objects/difficulty";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string }>;
}) {
  const { topicId: preselectedTopicId } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [topics, profile] = await Promise.all([
    new SupabaseTopicRepository(supabase).listActive(),
    new SupabaseUserProfileRepository(supabase).getById(user.id),
  ]);

  return (
    <main className="mx-auto max-w-xl flex-1 p-6 sm:p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Nova conversa</h1>

      <form action={startConversationAction} className="mt-6 flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <Label>Escolha um tema</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {topics.map((topic, index) => (
              <label
                key={topic.id}
                className="flex items-start gap-2 rounded-xl border bg-card p-3 text-sm transition-colors has-checked:border-primary has-checked:bg-accent"
              >
                <input
                  type="radio"
                  name="topicId"
                  value={topic.id}
                  defaultChecked={
                    preselectedTopicId ? topic.id === preselectedTopicId : index === 0
                  }
                  className="sr-only"
                />
                <TopicIcon category={topic.category} />
                <span>
                  <span className="block font-medium">{topic.title}</span>
                  {topic.description && (
                    <span className="mt-0.5 block text-muted-foreground">
                      {topic.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customTopic">Ou descreva seu próprio tema</Label>
          <Input
            id="customTopic"
            name="customTopic"
            placeholder="Ex.: Minha rotina de treino"
          />
          <p className="text-xs text-muted-foreground">
            Se preencher este campo, ele substitui o tema escolhido acima.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="difficulty">Nível</Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={profile?.targetLevel ?? "beginner"}
            className="rounded-md border bg-transparent px-3 py-2 text-sm"
          >
            {DIFFICULTIES.map((level) => (
              <option key={level} value={level}>
                {DIFFICULTY_LABELS[level]}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit">
          <MessageCirclePlus />
          Iniciar conversa
        </Button>
      </form>
    </main>
  );
}
