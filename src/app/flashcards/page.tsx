import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FlashcardsList, type FlashcardRow } from "@/components/flashcards-list";
import { FlashcardsSearchInput } from "@/components/flashcards-search-input";
import type { CardSchedule } from "@/domain/entities/card-schedule";
import type { Flashcard } from "@/domain/entities/flashcard";
import { FLASHCARD_LIST_FILTERS, type FlashcardListFilter } from "@/domain/ports/card-schedule-repository";
import { requireUser } from "@/infrastructure/supabase/require-user";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";

const PAGE_SIZE = 20;

const FILTER_LABELS: Record<FlashcardListFilter, string> = {
  pending: "Pendentes",
  new: "Novos",
  reviewed: "Revisados",
  suspended: "Suspensos",
  all: "Todos",
};

function buildDueChip(
  flashcard: Flashcard,
  schedule: CardSchedule,
  now: Date,
): { label: string; className: string } {
  if (flashcard.status === "suspended") {
    return { label: "Suspenso", className: "text-muted-foreground" };
  }
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
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
  const { filter: rawFilter, q, page: rawPage } = await searchParams;
  const filter: FlashcardListFilter = FLASHCARD_LIST_FILTERS.includes(
    rawFilter as FlashcardListFilter,
  )
    ? (rawFilter as FlashcardListFilter)
    : "pending";
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const { supabase, user } = await requireUser();

  const cardScheduleRepository = new SupabaseCardScheduleRepository(supabase);
  const now = new Date();

  const [counts, pageResult] = await Promise.all([
    cardScheduleRepository.countByUserForEachFilter(user.id, now),
    cardScheduleRepository.listByUserPaged({
      userId: user.id,
      filter,
      search: q ?? null,
      now,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const learningPointIds = [
    ...new Set(
      pageResult.items
        .map((item) => item.flashcard.learningPointId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const learningPoints = await new SupabaseLearningPointRepository(supabase).listByIds(
    learningPointIds,
  );
  const categoryByLearningPointId = new Map(learningPoints.map((point) => [point.id, point.category]));

  const rows: FlashcardRow[] = pageResult.items.map(({ flashcard, schedule }) => {
    const chip = buildDueChip(flashcard, schedule, now);
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

  const totalPages = Math.max(1, Math.ceil(pageResult.total / PAGE_SIZE));
  const searchSuffix = q ? `&q=${encodeURIComponent(q)}` : "";

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
        <div className="flex items-center gap-2.5">
          <Link
            href="/flashcards/import"
            className="flex h-11 items-center rounded-full border border-line px-5 text-sm font-bold hover:border-acc"
          >
            Importar arquivo
          </Link>
          <Link
            href="/flashcards/new"
            className="flex h-11 items-center rounded-full bg-acc px-5 text-sm font-bold text-acc-ink"
          >
            + Novo cartão
          </Link>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2 text-sm">
          {FLASHCARD_LIST_FILTERS.map((key) => (
            <Link
              key={key}
              href={`/flashcards?filter=${key}`}
              className={`rounded-full px-3.5 py-1.5 font-semibold ${
                filter === key
                  ? "bg-ink text-bg"
                  : "border border-line text-muted-foreground hover:border-acc"
              }`}
            >
              {FILTER_LABELS[key]} <span className="opacity-60">{counts[key]}</span>
            </Link>
          ))}
        </nav>
        <FlashcardsSearchInput />
      </div>

      <FlashcardsList rows={rows} />

      {pageResult.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <Link
            aria-disabled={page <= 1}
            href={`/flashcards?filter=${filter}&page=${page - 1}${searchSuffix}`}
            className={`flex h-9 items-center gap-1 rounded-full border border-line px-3.5 font-semibold ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:border-acc"
            }`}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Link>
          <span>
            Página {page} de {totalPages}
          </span>
          <Link
            aria-disabled={page >= totalPages}
            href={`/flashcards?filter=${filter}&page=${page + 1}${searchSuffix}`}
            className={`flex h-9 items-center gap-1 rounded-full border border-line px-3.5 font-semibold ${
              page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-acc"
            }`}
          >
            Próxima
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </main>
  );
}
