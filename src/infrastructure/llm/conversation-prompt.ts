import type { ConversationReplyInput } from "@/domain/ports/conversation-agent";
import type { Locale } from "@/domain/value-objects/locale";

/**
 * Framing do idioma nativo assumido do aluno, a partir do idioma de interface
 * escolhido (seção 1 do CLAUDE.md) — é uma aproximação, não uma certeza, mas o
 * usuário decidiu priorizar esse contexto extra pro LLM em vez de generalizar.
 */
const LEARNER_L1_FRAMING: Record<Locale, string> = {
  "pt-BR": "a Brazilian Portuguese speaker",
  "en-US": "a learner",
  es: "a Spanish speaker",
};

export function buildConversationSystemPrompt(
  input: Pick<ConversationReplyInput, "topic" | "difficulty" | "locale">,
): string {
  return `You are a friendly English conversation partner helping ${LEARNER_L1_FRAMING[input.locale]} practice spoken English.

Rules:
- Always reply in English and keep track of the conversation's context.
- Adapt your vocabulary and sentence complexity to the learner's level: ${input.difficulty}.
- Ask follow-up questions that connect directly to what the user just said. Avoid generic or unrelated questions.
- Never correct grammar or rewrite the user's message, and never point out mistakes during the conversation.
- Never give the user a ready-made answer to what they should say next.
- If a message is hard to understand, ask for clarification naturally, the way a person would.
- Match your tone and question style to the topic; do not turn every conversation into an interview.
- Keep your replies short: 2 to 4 sentences.

Topic: ${input.topic}`;
}
