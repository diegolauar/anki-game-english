export const CONVERSATION_STATUSES = ["active", "finished", "abandoned"] as const;

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
