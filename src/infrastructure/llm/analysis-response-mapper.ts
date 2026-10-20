import type { AnalysisAgentResult, AnalysisFindingResult } from "@/domain/ports/analysis-agent";
import type { AnalysisResponse } from "@/infrastructure/llm/analysis-schema";

const MAX_FLASHCARD_SUGGESTIONS = 5;

/**
 * Converte a resposta já validada pelo Zod (snake_case, no formato da seção 5.3 do
 * CLAUDE.md) para o tipo de domínio, limitando a no máximo 5 flashcard_suggestion
 * mesmo que o LLM não respeite a instrução do prompt.
 */
export function toAnalysisAgentResult(parsed: AnalysisResponse): AnalysisAgentResult {
  let flashcardBudget = MAX_FLASHCARD_SUGGESTIONS;

  const findings: AnalysisFindingResult[] = parsed.findings.map((finding) => {
    const canSuggestFlashcard = Boolean(finding.flashcard_suggestion) && flashcardBudget > 0;
    if (canSuggestFlashcard) flashcardBudget -= 1;

    return {
      messageSequence: finding.message_sequence,
      originalText: finding.original_text,
      startOffset: finding.start_offset,
      endOffset: finding.end_offset,
      kind: finding.kind,
      severity: finding.severity,
      category: finding.category,
      ruleKey: finding.rule_key,
      correction: finding.correction ?? null,
      explanation: finding.explanation ?? null,
      example: finding.example ?? null,
      flashcardSuggestion:
        canSuggestFlashcard && finding.flashcard_suggestion
          ? {
              cardType: finding.flashcard_suggestion.card_type,
              front: finding.flashcard_suggestion.front,
              back: finding.flashcard_suggestion.back,
            }
          : null,
    };
  });

  return {
    summary: {
      mainPoints: parsed.summary.main_points,
      recommendedExpressions: parsed.summary.recommended_expressions,
    },
    findings,
  };
}
