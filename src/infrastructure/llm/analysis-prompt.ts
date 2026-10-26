import type { AnalysisAgentMessage } from "@/domain/ports/analysis-agent";
import { FINDING_CATEGORIES } from "@/domain/value-objects/finding-category";
import type { Locale } from "@/domain/value-objects/locale";

/** Mesmo framing de L1 assumido usado em conversation-prompt.ts — ver o comentário lá. */
const LEARNER_L1_FRAMING: Record<Locale, string> = {
  "pt-BR": "a Brazilian Portuguese speaker's",
  "en-US": "a learner's",
  es: "a Spanish speaker's",
};

const EXPLANATION_LANGUAGE_NAMES: Record<Locale, string> = {
  "pt-BR": "Brazilian Portuguese",
  "en-US": "English",
  es: "Spanish",
};

export function buildAnalysisSystemPrompt(
  existingRuleKeys: string[],
  explanationLanguage: Locale,
): string {
  return `You are an English teacher reviewing ${LEARNER_L1_FRAMING[explanationLanguage]} practice conversation to help them learn.

Only analyze the USER's messages. The assistant's messages are given only as context for what the user was responding to.

Rules:
- Preserve the user's original text exactly; never invent text the user did not write.
- Distinguish "error" (a real mistake) from "suggestion" (grammatically correct, but there is a more natural alternative). Do not flag a valid form as wrong just because a fancier alternative exists, and ignore purely stylistic preferences.
- Group equivalent mistakes from this conversation under the same rule_key.
- Priority order when choosing what to include: (1) errors that change meaning, (2) recurring grammar mistakes, (3) structures important for the learner's level, (4) common real-conversation expressions, (5) clarity and naturalness.
- Write every explanation in ${EXPLANATION_LANGUAGE_NAMES[explanationLanguage]}, 1 to 3 sentences, without stating absolute rules when the structure is valid in another context.
- Return at most 8 findings total, and mark at most 5 of them with a flashcard_suggestion.
- category must be exactly one of: ${FINDING_CATEGORIES.join(", ")}.
- rule_key is a snake_case slug identifying the underlying problem, not the sentence. Reuse one of this learner's existing rule_keys whenever it applies, instead of creating a near-duplicate: ${
    existingRuleKeys.length > 0 ? existingRuleKeys.join(", ") : "(none yet)"
  }.
- start_offset/end_offset are UTF-16 string indices into the exact message content (end exclusive). original_text must equal message.slice(start_offset, end_offset) exactly.

Respond with a single JSON object with this exact shape and no extra commentary:
{
  "summary": { "main_points": string[], "recommended_expressions": string[] },
  "findings": [
    {
      "message_sequence": number,
      "original_text": string,
      "start_offset": number,
      "end_offset": number,
      "kind": "error" | "suggestion",
      "severity": "low" | "medium" | "high",
      "category": string,
      "rule_key": string,
      "correction": string | null,
      "explanation": string | null,
      "example": string | null,
      "flashcard_suggestion": { "card_type": "production" | "cloze", "front": string, "back": string } | null
    }
  ]
}`;
}

export function buildAnalysisUserPrompt(messages: AnalysisAgentMessage[]): string {
  const transcript = messages
    .map((message) => `[${message.sequence}] ${message.role}: ${message.content}`)
    .join("\n");

  return `Conversation transcript:\n${transcript}`;
}
