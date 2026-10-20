export const FLASHCARD_STATUSES = ["suggested", "active", "suspended", "discarded"] as const;

export type FlashcardStatus = (typeof FLASHCARD_STATUSES)[number];
