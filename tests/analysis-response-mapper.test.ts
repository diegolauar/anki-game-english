import { describe, expect, it } from "vitest";
import { analysisResponseSchema } from "@/infrastructure/llm/analysis-schema";
import { toAnalysisAgentResult } from "@/infrastructure/llm/analysis-response-mapper";

function buildFinding(overrides: Record<string, unknown> = {}) {
  return {
    message_sequence: 1,
    original_text: "have worked a lot yesterday",
    start_offset: 2,
    end_offset: 29,
    kind: "error",
    severity: "high",
    category: "grammar.verb_tense",
    rule_key: "simple_past_with_finished_time",
    correction: "worked a lot yesterday",
    explanation: "Para uma ação concluída num momento específico do passado, use o Simple Past.",
    example: "I watched a movie last night.",
    flashcard_suggestion: {
      card_type: "production",
      front: "Como digo que trabalhei muito ontem?",
      back: "I worked a lot yesterday.",
    },
    ...overrides,
  };
}

describe("analysisResponseSchema + toAnalysisAgentResult", () => {
  it("parses a well-formed response and maps it to camelCase", () => {
    const raw = {
      summary: {
        main_points: ["Falou sobre a rotina de trabalho."],
        recommended_expressions: ["I used to..."],
      },
      findings: [buildFinding()],
    };

    const parsed = analysisResponseSchema.parse(raw);
    const result = toAnalysisAgentResult(parsed);

    expect(result.summary.mainPoints).toEqual(["Falou sobre a rotina de trabalho."]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      messageSequence: 1,
      ruleKey: "simple_past_with_finished_time",
      kind: "error",
      flashcardSuggestion: {
        cardType: "production",
        front: "Como digo que trabalhei muito ontem?",
        back: "I worked a lot yesterday.",
      },
    });
  });

  it("rejects a category outside the fixed list", () => {
    const raw = {
      summary: { main_points: [], recommended_expressions: [] },
      findings: [buildFinding({ category: "grammar.made_up_category" })],
    };

    expect(() => analysisResponseSchema.parse(raw)).toThrow();
  });

  it("rejects more than 8 findings", () => {
    const raw = {
      summary: { main_points: [], recommended_expressions: [] },
      findings: Array.from({ length: 9 }, () => buildFinding()),
    };

    expect(() => analysisResponseSchema.parse(raw)).toThrow();
  });

  it("caps flashcard suggestions at 5, even if the LLM ignores the prompt instruction", () => {
    const raw = {
      summary: { main_points: [], recommended_expressions: [] },
      findings: Array.from({ length: 8 }, (_, index) =>
        buildFinding({ rule_key: `rule_${index}` }),
      ),
    };

    const parsed = analysisResponseSchema.parse(raw);
    const result = toAnalysisAgentResult(parsed);

    const suggestedCount = result.findings.filter((finding) => finding.flashcardSuggestion).length;
    expect(suggestedCount).toBe(5);
  });
});
