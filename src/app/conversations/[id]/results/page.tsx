import { notFound } from "next/navigation";
import { retryAnalysisAction } from "@/app/conversations/actions";
import { Button } from "@/components/ui/button";
import { FlashcardSuggestionsPanel } from "@/components/flashcard-suggestions-panel";
import { TranscriptView, type TranscriptMessage } from "@/components/transcript-view";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseAnalysisRepository } from "@/infrastructure/supabase/analysis-repository";
import { SupabaseConversationRepository } from "@/infrastructure/supabase/conversation-repository";
import { SupabaseFindingRepository } from "@/infrastructure/supabase/finding-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseMessageRepository } from "@/infrastructure/supabase/message-repository";

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

  const analysis = await new SupabaseAnalysisRepository(supabase).findLatestByConversationId(id);
  if (!analysis) notFound();

  if (analysis.status === "failed") {
    return (
      <main className="mx-auto max-w-2xl flex-1 p-8">
        <h1 className="text-xl font-semibold">Não foi possível analisar esta conversa</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {analysis.errorMessage ?? "Erro desconhecido."}
        </p>
        <form action={retryAnalysisAction} className="mt-4">
          <input type="hidden" name="analysisId" value={analysis.id} />
          <Button type="submit">Tentar novamente</Button>
        </form>
      </main>
    );
  }

  if (analysis.status !== "completed") {
    return (
      <main className="mx-auto max-w-2xl flex-1 p-8">
        <p className="text-sm text-muted-foreground">Analisando sua conversa...</p>
      </main>
    );
  }

  const messages = await new SupabaseMessageRepository(supabase).listByConversation(id);
  const findings = await new SupabaseFindingRepository(supabase).listByAnalysisId(analysis.id);
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
      originalText: finding.originalText,
      correction: finding.correction,
      explanation: finding.explanation,
      example: finding.example,
    })),
  }));

  return (
    <main className="mx-auto max-w-2xl flex-1 p-8">
      <h1 className="text-2xl font-semibold">Resultado da conversa</h1>

      {analysis.summary && (
        <section className="mt-4 rounded-lg border p-4">
          <h2 className="font-medium">Resumo</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {analysis.summary.mainPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {analysis.summary.recommendedExpressions.length > 0 && (
            <>
              <h3 className="mt-3 text-sm font-medium">Expressões recomendadas</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {analysis.summary.recommendedExpressions.map((expression) => (
                  <li key={expression}>{expression}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Transcrição</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Clique num trecho destacado para ver a correção e a explicação.
        </p>
        <TranscriptView messages={transcriptMessages} />
      </section>

      <FlashcardSuggestionsPanel
        flashcards={suggestedFlashcards}
        resultsPath={`/conversations/${id}/results`}
      />
    </main>
  );
}
