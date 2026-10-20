import type { Conversation } from "@/domain/entities/conversation";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { Difficulty } from "@/domain/value-objects/difficulty";

export interface StartConversationInput {
  userId: string;
  topicId: string | null;
  customTopic: string | null;
  difficulty: Difficulty;
}

export class StartConversation {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(input: StartConversationInput): Promise<Conversation> {
    if (!input.topicId && !input.customTopic) {
      throw new Error("A conversation needs either a topicId or a customTopic.");
    }

    return this.conversationRepository.create(input);
  }
}
