import { AwardXp } from "@/application/use-cases/award-xp";
import type { AnalysisWriter } from "@/domain/ports/analysis-writer";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { MessageRepository } from "@/domain/ports/message-repository";
import type { XpEventWriter } from "@/domain/ports/xp-event-writer";
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
    private readonly analysisWriter: AnalysisWriter,
    private readonly messageRepository: MessageRepository,
    private readonly xpEventWriter: XpEventWriter,
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
    const analysis = await this.analysisWriter.create(input.conversationId);

    const messages = await this.messageRepository.listByConversation(input.conversationId);
    const userMessageCount = messages.filter((message) => message.role === "user").length;

    if (userMessageCount >= MIN_USER_MESSAGES_FOR_CONVERSATION_XP) {
      await new AwardXp(this.xpEventWriter).execute({
        userId: input.userId,
        sourceType: "conversation_finished",
        sourceId: input.conversationId,
      });
    }

    return { analysisId: analysis.id };
  }
}
