import { AwardXp } from "@/application/use-cases/award-xp";
import type { AnalysisRepository } from "@/domain/ports/analysis-repository";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { MessageRepository } from "@/domain/ports/message-repository";
import type { XpEventRepository } from "@/domain/ports/xp-event-repository";
import { MIN_USER_MESSAGES_FOR_CONVERSATION_XP } from "@/domain/rules/xp-rewards";

export interface FinishConversationInput {
  conversationId: string;
  userId: string;
}

export interface FinishConversationResult {
  analysisId: string;
}

export class FinishConversation {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly analysisRepository: AnalysisRepository,
    private readonly messageRepository: MessageRepository,
    private readonly xpEventRepository: XpEventRepository,
  ) {}

  async execute(input: FinishConversationInput): Promise<FinishConversationResult> {
    const conversation = await this.conversationRepository.findById(input.conversationId);

    if (!conversation || conversation.userId !== input.userId) {
      throw new Error("Conversation not found.");
    }
    if (conversation.status !== "active") {
      throw new Error("This conversation is already finished.");
    }

    await this.conversationRepository.finish(input.conversationId);
    const analysis = await this.analysisRepository.create(input.conversationId);

    const messages = await this.messageRepository.listByConversation(input.conversationId);
    const userMessageCount = messages.filter((message) => message.role === "user").length;

    if (userMessageCount >= MIN_USER_MESSAGES_FOR_CONVERSATION_XP) {
      await new AwardXp(this.xpEventRepository).execute({
        userId: input.userId,
        sourceType: "conversation_finished",
        sourceId: input.conversationId,
      });
    }

    return { analysisId: analysis.id };
  }
}
