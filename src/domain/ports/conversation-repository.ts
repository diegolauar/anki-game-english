import type { Conversation } from "@/domain/entities/conversation";
import type { Difficulty } from "@/domain/value-objects/difficulty";

export interface CreateConversationInput {
  userId: string;
  topicId: string | null;
  customTopic: string | null;
  difficulty: Difficulty;
}

export interface ConversationRepository {
  create(input: CreateConversationInput): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
}
