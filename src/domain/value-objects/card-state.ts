export const CARD_STATES = ["new", "learning", "review", "relearning"] as const;

export type CardState = (typeof CARD_STATES)[number];
