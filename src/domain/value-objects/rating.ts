export const RATINGS = ["again", "hard", "good", "easy"] as const;

export type Rating = (typeof RATINGS)[number];
