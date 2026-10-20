export const INPUT_MODES = ["text", "voice"] as const;

export type InputMode = (typeof INPUT_MODES)[number];
