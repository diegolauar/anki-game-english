import type { ConversationStatus } from "@/domain/value-objects/conversation-status";
import type { Difficulty } from "@/domain/value-objects/difficulty";

export interface Conversation {
  id: string;
  userId: string;
  topicId: string | null;
  customTopic: string | null;
  difficulty: Difficulty;
  status: ConversationStatus;
  startedAt: string;
  endedAt: string | null;
}
