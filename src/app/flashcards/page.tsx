import Link from "next/link";
import { redirect } from "next/navigation";
import { FlashcardsList, type FlashcardRow } from "@/components/flashcards-list";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { CardSchedule } from "@/domain/entities/card-schedule";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";

type FilterKey = "pending" | "new" | "reviewed" | "suspended" | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pendentes" },
  { key: "new", label: "Novos" },
  { key: "reviewed", label: "Revisados" },
  { key: "suspended", label: "Suspensos" },
  { key: "all", label: "Todos" },
];

function buildDueChip(
  flashcard: Flashcard,
  schedule: CardSchedule | undefined,
  now: Date,
): { label: string; className: string } {
  if (flashcard.status === "suspended") {
    return { label: "Suspenso", className: "text-muted-foreground" };
  }
  if (!schedule) return { label: "—", className: "text-muted-foreground" };
  if (schedule.state === "new") {
    return { label: "Novo", className: "bg-acc-soft text-acc-strong" };
  }
  const dueAt = new Date(schedule.dueAt).getTime();
  if (dueAt <= now.getTime()) {
    return { label: "Hoje", className: "bg-err-soft text-err" };
  }
  const days = Math.ceil((dueAt - now.getTime()) / (24 * 60 * 60 * 1000));
  return { label: `Em ${days} ${days === 1 ? "dia" : "dias"}`, className: "text-muted-foreground" };
}

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

  const learningPointIds = [
    ...new Set(
      [...activeFlashcards, ...suspendedFlashcards]
        .map((flashcard) => flashcard.learningPointId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const learningPoints = await new SupabaseLearningPointRepository(supabase).listByIds(
    learningPointIds,
  );
  const categoryByLearningPointId = new Map(
    learningPoints.map((point) => [point.id, point.category]),
  );

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

  const counts: Record<FilterKey, number> = {
    pending: activeFlashcards.filter((flashcard) => {
      const schedule = scheduleByFlashcardId.get(flashcard.id);
      return schedule && new Date(schedule.dueAt).getTime() <= now.getTime();
    }).length,
    new: activeFlashcards.filter(
      (flashcard) => scheduleByFlashcardId.get(flashcard.id)?.state === "new",
    ).length,
    reviewed: activeFlashcards.filter(
      (flashcard) => (scheduleByFlashcardId.get(flashcard.id)?.reps ?? 0) > 0,
    ).length,
    suspended: suspendedFlashcards.length,
    all: activeFlashcards.length + suspendedFlashcards.length,
  };

  const rows: FlashcardRow[] = visibleFlashcards.map((flashcard) => {
    const chip = buildDueChip(flashcard, scheduleByFlashcardId.get(flashcard.id), now);
    return {
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      category: flashcard.learningPointId
        ? (categoryByLearningPointId.get(flashcard.learningPointId) ?? null)
        : null,
      cardType: flashcard.cardType,
      suspended: flashcard.status === "suspended",
      dueLabel: chip.label,
      dueClassName: chip.className,
    };
  });

  return (
    <main className="mx-auto max-w-[1120px] flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
            Flashcards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.all} cartões · {counts.pending} para revisar hoje
          </p>
        </div>
        <Link
          href="/flashcards/new"
          className="flex h-11 items-center rounded-full bg-acc px-5 text-sm font-bold text-acc-ink"
        >
          + Novo cartão
        </Link>
      </header>

      <nav className="mt-5 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={`/flashcards?filter=${item.key}`}
            className={`rounded-full px-3.5 py-1.5 font-semibold ${
              filter === item.key
                ? "bg-ink text-bg"
                : "border border-line text-muted-foreground hover:border-acc"
            }`}
          >
            {item.label} <span className="opacity-60">{counts[item.key]}</span>
          </Link>
        ))}
      </nav>

      <FlashcardsList rows={rows} />
    </main>
  );
}
