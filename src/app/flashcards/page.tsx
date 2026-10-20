import Link from "next/link";
import { redirect } from "next/navigation";
import { toggleFlashcardSuspensionAction } from "@/app/flashcards/actions";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/domain/entities/flashcard";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";

type FilterKey = "pending" | "new" | "reviewed" | "suspended" | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pendentes" },
  { key: "new", label: "Novos" },
  { key: "reviewed", label: "Revisados" },
  { key: "suspended", label: "Suspensos" },
  { key: "all", label: "Todos" },
];

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: FilterKey = FILTERS.some((item) => item.key === rawFilter)
    ? (rawFilter as FilterKey)
    : "pending";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const flashcardRepository = new SupabaseFlashcardRepository(supabase);
  const cardScheduleRepository = new SupabaseCardScheduleRepository(supabase);

  const [activeFlashcards, suspendedFlashcards] = await Promise.all([
    flashcardRepository.listByUser(user.id, "active"),
    flashcardRepository.listByUser(user.id, "suspended"),
  ]);

  const schedules = await cardScheduleRepository.listByFlashcardIds(
    activeFlashcards.map((flashcard) => flashcard.id),
  );
  const scheduleByFlashcardId = new Map(schedules.map((schedule) => [schedule.flashcardId, schedule]));

  const now = new Date();
  let visibleFlashcards: Flashcard[];
  switch (filter) {
    case "pending":
      visibleFlashcards = activeFlashcards.filter((flashcard) => {
        const schedule = scheduleByFlashcardId.get(flashcard.id);
        return schedule && new Date(schedule.dueAt).getTime() <= now.getTime();
      });
      break;
    case "new":
      visibleFlashcards = activeFlashcards.filter(
        (flashcard) => scheduleByFlashcardId.get(flashcard.id)?.state === "new",
      );
      break;
    case "reviewed":
      visibleFlashcards = activeFlashcards.filter(
        (flashcard) => (scheduleByFlashcardId.get(flashcard.id)?.reps ?? 0) > 0,
      );
      break;
    case "suspended":
      visibleFlashcards = suspendedFlashcards;
      break;
    case "all":
      visibleFlashcards = [...activeFlashcards, ...suspendedFlashcards];
      break;
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Flashcards</h1>
        <Button render={<Link href="/flashcards/new">Criar manual</Link>} />
      </header>

      <nav className="mt-4 flex gap-2 text-sm">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={`/flashcards?filter=${item.key}`}
            className={`rounded-full px-3 py-1 ${
              filter === item.key ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <ul className="mt-6 flex flex-col gap-3">
        {visibleFlashcards.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum flashcard aqui por enquanto.</p>
        )}
        {visibleFlashcards.map((flashcard) => (
          <li key={flashcard.id} className="rounded-lg border p-4">
            <p className="text-sm font-medium">{flashcard.front}</p>
            <p className="mt-1 text-sm text-muted-foreground">{flashcard.back}</p>
            <div className="mt-3 flex gap-2">
              <Button
                render={<Link href={`/flashcards/${flashcard.id}/edit`}>Editar</Link>}
                variant="outline"
                size="sm"
              />
              <form action={toggleFlashcardSuspensionAction}>
                <input type="hidden" name="flashcardId" value={flashcard.id} />
                <Button type="submit" variant="ghost" size="sm">
                  {flashcard.status === "suspended" ? "Reativar" : "Suspender"}
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
