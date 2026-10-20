import type { AnalysisRepository } from "@/domain/ports/analysis-repository";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";

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

    return { analysisId: analysis.id };
  }
}
