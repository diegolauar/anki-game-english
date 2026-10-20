export const CARD_TYPES = ["production", "cloze", "manual"] as const;

export type CardType = (typeof CARD_TYPES)[number];
