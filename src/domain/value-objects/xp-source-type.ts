export const XP_SOURCE_TYPES = [
  "conversation_finished",
  "flashcard_saved",
  "flashcard_reviewed",
  "daily_reviews_completed",
] as const;

export type XpSourceType = (typeof XP_SOURCE_TYPES)[number];
