import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleCheck, Flame, Play, Star } from "lucide-react";
import { TopicIcon } from "@/components/topic-icon";
import { GetDashboard } from "@/application/use-cases/get-dashboard";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseAnalysisRepository } from "@/infrastructure/supabase/analysis-repository";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseFindingRepository } from "@/infrastructure/supabase/finding-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseReviewLogRepository } from "@/infrastructure/supabase/review-log-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";
import { SupabaseXpEventRepository } from "@/infrastructure/supabase/xp-event-repository";

const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];

function formatHeaderDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function buildWeekDays(weeklyXp: { dateKey: string; amount: number }[]) {
  const totalsByDate = new Map(weeklyXp.map((day) => [day.dateKey, day.amount]));
  const todayKey = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateKey = date.toISOString().slice(0, 10);
    return {
      dateKey,
      amount: totalsByDate.get(dateKey) ?? 0,
      isToday: dateKey === todayKey,
      letter: WEEKDAY_INITIALS[date.getDay()],
    };
  });
  const maxAmount = Math.max(1, ...days.map((day) => day.amount));
  return { days, maxAmount };
}

function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(date);
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "Em andamento";
  const minutes = Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
  return `${minutes} min`;
}

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
    new SupabaseConversationRepository(supabase),
    new SupabaseMessageRepository(supabase),
    new SupabaseAnalysisRepository(supabase),
    new SupabaseLearningPointRepository(supabase),
    new SupabaseReviewLogRepository(supabase),
    new SupabaseFindingRepository(supabase),
  );
  const {
    profile,
    topics,
    pendingReviewCount,
    reviewedTodayCount,
    totalXp,
    streak,
    weeklyXp,
    topLearningPoints,
    recentConversations,
  } = await getDashboard.execute(user.id);

  const displayName = profile?.displayName ?? user.email ?? "";
  const initial = displayName.charAt(0).toUpperCase() || "?";
  const { days: weekDays, maxAmount: weekMaxAmount } = buildWeekDays(weeklyXp);
  const weekTotalXp = weekDays.reduce((sum, day) => sum + day.amount, 0);

  const heroTopic = topics.length > 0 ? topics[new Date().getDate() % topics.length] : null;
  const heroLearningPoint = topLearningPoints[0] ?? null;

  const todaysSessionSize = reviewedTodayCount + pendingReviewCount;
  const reviewProgressPercent =
    todaysSessionSize > 0 ? Math.round((reviewedTodayCount / todaysSessionSize) * 100) : 100;
  const estimatedMinutesLeft = Math.max(1, Math.round(pendingReviewCount * 0.75));

  return (
    <main className="mx-auto max-w-[1120px] flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{formatHeaderDate(new Date())}</p>
          <h1 className="font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
            Olá, {displayName}.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-bold">
            <Flame className="size-3.5 fill-fire text-fire" />
            {streak} {streak === 1 ? "dia" : "dias"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-bold">
            <Star className="size-3.5 fill-xp text-xp" />
            {totalXp.toLocaleString("pt-BR")} XP
          </span>
          <span className="flex size-10 items-center justify-center rounded-full bg-acc-soft text-sm font-bold text-acc-strong">
            {initial}
          </span>
        </div>
      </header>

      <section className="mt-7 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <div className="relative min-h-[260px] overflow-hidden rounded-card bg-acc p-8 text-acc-ink">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-acc-ink/10"
          />
          <p className="relative text-xs font-bold tracking-[.06em] uppercase opacity-80">
            Sugestão para hoje
          </p>
          <h2 className="relative mt-2 max-w-sm font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">
            {heroTopic ? heroTopic.title : "Pronto para sua primeira conversa?"}
          </h2>
          <p className="relative mt-3 max-w-sm text-sm opacity-90">
            {heroLearningPoint
              ? `Você repetiu esse ponto ${heroLearningPoint.occurrenceCount}× em conversas anteriores: ${
                  heroLearningPoint.canonicalCorrection ?? heroLearningPoint.explanation ?? ""
                }`
              : "Converse sobre o que quiser — as correções aparecem só no final."}
          </p>
          <div className="relative mt-6 flex flex-wrap gap-2.5">
            <Link
              href={heroTopic ? `/conversations/new?topicId=${heroTopic.id}` : "/conversations/new"}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-acc-ink px-5 text-sm font-bold text-acc"
            >
              <Play className="size-4 fill-current" />
              Começar conversa
            </Link>
            <Link
              href="/conversations/new"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-bold"
            >
              Escolher outro tema
            </Link>
          </div>
        </div>

        <div className="flex flex-col rounded-card border border-line bg-surface p-7">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-[.06em] text-muted-foreground uppercase">
              Revisão de hoje
            </p>
            {pendingReviewCount > 0 && (
              <span className="rounded-full bg-sug-soft px-2.5 py-1 text-xs font-bold text-xp">
                +10 XP
              </span>
            )}
          </div>

          {pendingReviewCount > 0 ? (
            <>
              <p className="mt-3 font-display text-[64px] leading-none font-bold">
                {pendingReviewCount}
              </p>
              <p className="text-sm text-muted-foreground">cartões pendentes</p>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-surface2">
                <div className="h-full bg-acc" style={{ width: `${reviewProgressPercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {reviewedTodayCount} revisado{reviewedTodayCount === 1 ? "" : "s"} · cerca de{" "}
                {estimatedMinutesLeft} min restantes
              </p>
              <Link
                href="/review"
                className="mt-5 inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-bg"
              >
                Revisar agora <ArrowRight className="size-4" />
              </Link>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
              <CircleCheck className="size-8 text-ok" />
              <p className="font-semibold">Tudo revisado hoje</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <div className="rounded-card border border-line bg-surface p-7">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[22px] font-bold tracking-[-0.01em]">Sua semana</h3>
            <p className="text-sm text-muted-foreground">{weekTotalXp} XP</p>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2">
            {weekDays.map((day) => (
              <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-9 w-full max-w-9 items-end justify-center">
                  <div
                    className={`w-full rounded-[10px] ${
                      day.amount === 0 ? "bg-surface2" : day.isToday ? "bg-acc" : "bg-acc-soft"
                    }`}
                    style={{ height: `${Math.max(6, (day.amount / weekMaxAmount) * 100)}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-bold ${day.isToday ? "text-acc-strong" : "text-muted-foreground"}`}
                >
                  {day.letter}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-7">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.01em]">
            Pontos que se repetem
          </h3>
          {topLearningPoints.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Ainda não há pontos recorrentes — eles aparecem conforme você conversa.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {topLearningPoints.map((point) => (
                <li key={point.id} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-err-soft text-sm font-bold text-err">
                    {point.occurrenceCount}×
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {point.explanation ?? point.ruleKey.replaceAll("_", " ")}
                    </p>
                    {point.canonicalCorrection && (
                      <p className="truncate text-[13px] text-muted-foreground">
                        {point.canonicalCorrection}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.01em]">
            Temas para conversar
          </h3>
        </div>
        <ul
          className="mt-4 grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
        >
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/conversations/new?topicId=${topic.id}`}
                className="flex h-full flex-col gap-2 rounded-control border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-acc"
              >
                <TopicIcon slug={topic.slug} size="md" />
                <span>
                  <span className="block text-[15px] font-bold">{topic.title}</span>
                  {topic.description && (
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {topic.description}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {recentConversations.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.01em]">
            Conversas recentes
          </h3>
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
            {recentConversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/conversations/${conversation.id}/results`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-surface2"
                >
                  <TopicIcon slug={null} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{conversation.title}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {formatRelativeDay(conversation.startedAt)} · {conversation.messageCount}{" "}
                      mensagens · {formatDuration(conversation.startedAt, conversation.endedAt)}
                    </p>
                  </div>
                  <StatusChip
                    status={conversation.analysisStatus}
                    errorCount={conversation.errorCount}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function StatusChip({
  status,
  errorCount,
}: {
  status: "pending" | "processing" | "completed" | "failed" | "none";
  errorCount: number;
}) {
  if (status === "completed") {
    return (
      <span className="shrink-0 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-bold text-ok">
        Analisada · {errorCount} {errorCount === 1 ? "erro" : "erros"}
      </span>
    );
  }
  if (status === "pending" || status === "processing") {
    return (
      <span className="shrink-0 rounded-full bg-acc-soft px-2.5 py-1 text-xs font-bold text-acc-strong">
        Analisando…
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 rounded-full bg-err-soft px-2.5 py-1 text-xs font-bold text-err">
        Falhou · tentar de novo
      </span>
    );
  }
  return null;
}
