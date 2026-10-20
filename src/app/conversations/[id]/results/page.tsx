import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { retryAnalysisAction } from "@/app/conversations/actions";
import { FlashcardSuggestionsPanel } from "@/components/flashcard-suggestions-panel";
import { TranscriptView, type TranscriptMessage } from "@/components/transcript-view";
import { DIFFICULTY_LABELS } from "@/lib/difficulty-labels";
import { MIN_USER_MESSAGES_FOR_CONVERSATION_XP, XP_REWARDS } from "@/domain/rules/xp-rewards";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseAnalysisRepository } from "@/infrastructure/supabase/analysis-repository";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseFindingRepository } from "@/infrastructure/supabase/finding-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";
import { SupabaseTopicRepository } from "@/infrastructure/supabase/topic-repository";
import { SupabaseUserProfileRepository } from "@/infrastructure/supabase/user-profile-repository";

export default async function ConversationResultsPage({
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

  const [profile, topic] = await Promise.all([
    new SupabaseUserProfileRepository(supabase).getById(user.id),
    conversation.topicId
      ? new SupabaseTopicRepository(supabase).findById(conversation.topicId)
      : Promise.resolve(null),
  ]);
  const topicTitle = conversation.customTopic ?? topic?.title ?? "Conversa";
  const displayName = profile?.displayName ?? user.email ?? "";

  const analysis = await new SupabaseAnalysisRepository(supabase).findLatestByConversationId(id);
  if (!analysis) notFound();

  const resultsHeader = (
    <>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Início
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">
        Análise concluída · {topicTitle} · {DIFFICULTY_LABELS[conversation.difficulty]}
      </p>
    </>
  );

  if (analysis.status === "failed") {
    return (
      <main className="mx-auto max-w-[1120px] flex-1 px-6 pt-10 pb-[60px] sm:px-10">
        {resultsHeader}
        <div className="mt-4 rounded-card bg-err-soft p-6">
          <h1 className="font-display text-xl font-bold text-err">
            Não foi possível analisar esta conversa
          </h1>
          <p className="mt-2 text-sm text-err/80">
            {analysis.errorMessage ?? "Erro desconhecido."} Sua conversa está salva.
          </p>
          <form action={retryAnalysisAction} className="mt-4">
            <input type="hidden" name="analysisId" value={analysis.id} />
            <button
              type="submit"
              className="flex h-11 items-center rounded-full bg-err px-5 text-sm font-bold text-white"
            >
              Tentar novamente
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (analysis.status !== "completed") {
    return (
      <main className="mx-auto max-w-[1120px] flex-1 px-6 pt-10 pb-[60px] sm:px-10">
        {resultsHeader}
        <div className="mt-6 flex items-center gap-3 rounded-card border border-line bg-surface p-6">
          <span className="size-5 animate-spin rounded-full border-2 border-acc border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Analisando sua conversa… isso leva alguns segundos.
          </p>
        </div>
      </main>
    );
  }

  const messages = await new SupabaseMessageRepository(supabase).listByConversation(id);
  const findings = await new SupabaseFindingRepository(supabase).listByAnalysisId(analysis.id);
  const learningPointIds = [
    ...new Set(findings.map((finding) => finding.learningPointId).filter((id): id is string => id !== null)),
  ];
  const learningPoints = await new SupabaseLearningPointRepository(supabase).listByIds(
    learningPointIds,
  );
  const occurrenceByLearningPointId = new Map(
    learningPoints.map((point) => [point.id, point.occurrenceCount]),
  );

  const suggestedFlashcards = (
    await new SupabaseFlashcardRepository(supabase).listBySourceFindingIds(
      findings.map((finding) => finding.id),
    )
  ).filter((flashcard) => flashcard.status === "suggested");

  const findingsByMessageId = new Map<string, typeof findings>();
  for (const finding of findings) {
    const list = findingsByMessageId.get(finding.messageId) ?? [];
    list.push(finding);
    findingsByMessageId.set(finding.messageId, list);
  }

  const transcriptMessages: TranscriptMessage[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    findings: (findingsByMessageId.get(message.id) ?? []).map((finding) => ({
      id: finding.id,
      startOffset: finding.startOffset,
      endOffset: finding.endOffset,
      kind: finding.kind,
      category: finding.category,
      originalText: finding.originalText,
      correction: finding.correction,
      explanation: finding.explanation,
      example: finding.example,
      occurrenceCount: finding.learningPointId
        ? (occurrenceByLearningPointId.get(finding.learningPointId) ?? null)
        : null,
    })),
  }));

  const userMessageCount = messages.filter((message) => message.role === "user").length;
  const errorCount = findings.filter((finding) => finding.kind === "error").length;
  const suggestionCount = findings.filter((finding) => finding.kind === "suggestion").length;
  const earnedConversationXp = userMessageCount >= MIN_USER_MESSAGES_FOR_CONVERSATION_XP;

  return (
    <main className="mx-auto max-w-[1120px] flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      {resultsHeader}
      <h1 className="mt-1 font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
        Boa conversa, {displayName}!
      </h1>

      <section
        className="mt-6 grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <StatCard value={String(userMessageCount)} label="mensagens suas" />
        <StatCard
          value={String(errorCount)}
          label={errorCount === 1 ? "erro para revisar" : "erros para revisar"}
          className="bg-err-soft text-err"
        />
        <StatCard
          value={String(suggestionCount)}
          label={suggestionCount === 1 ? "sugestão de naturalidade" : "sugestões de naturalidade"}
          className="bg-sug-soft text-sug-ink"
        />
        <StatCard
          value={earnedConversationXp ? `+${XP_REWARDS.conversation_finished}` : "0"}
          label={earnedConversationXp ? "XP conversa concluída" : "XP (mínimo 4 mensagens)"}
          className={earnedConversationXp ? "bg-acc text-acc-ink" : undefined}
        />
      </section>

      {analysis.summary && (
        <section
          className="mt-5 grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
        >
          <div className="rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold">Principais pontos</h2>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {analysis.summary.mainPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          {analysis.summary.recommendedExpressions.length > 0 && (
            <div className="rounded-card border border-line bg-surface p-6">
              <h2 className="font-display text-lg font-bold">Expressões para usar na próxima</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.summary.recommendedExpressions.map((expression) => (
                  <span
                    key={expression}
                    className="rounded-full bg-acc-soft px-3 py-1 text-sm text-acc-strong"
                  >
                    {expression}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-8">
        <TranscriptView messages={transcriptMessages} />
      </section>

      <FlashcardSuggestionsPanel
        flashcards={suggestedFlashcards}
        resultsPath={`/conversations/${id}/results`}
      />
    </main>
  );
}

function StatCard({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-line p-5 ${className ?? "bg-surface"}`}>
      <p className="font-display text-[32px] leading-none font-bold">{value}</p>
      <p className="mt-1 text-sm opacity-90">{label}</p>
    </div>
  );
}
