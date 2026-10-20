import type { XpSourceType } from "@/domain/value-objects/xp-source-type";

export const XP_REWARDS: Record<XpSourceType, number> = {
  conversation_finished: 20,
  flashcard_saved: 2,
  flashcard_reviewed: 1,
  daily_reviews_completed: 10,
};

/** Seção 8 do CLAUDE.md: só paga XP de conversa com pelo menos 4 mensagens do usuário. */
export const MIN_USER_MESSAGES_FOR_CONVERSATION_XP = 4;
