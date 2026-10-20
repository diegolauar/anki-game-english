export const MESSAGE_ROLES = ["user", "assistant"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];
