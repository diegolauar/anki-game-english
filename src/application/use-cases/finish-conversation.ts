import { AwardXp } from "@/application/use-cases/award-xp";
import type { AnalysisWriter } from "@/domain/ports/analysis-writer";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { DailyUsageRepository } from "@/domain/ports/daily-usage-repository";
import type { MessageRepository } from "@/domain/ports/message-repository";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";
import type { XpEventWriter } from "@/domain/ports/xp-event-writer";
import { getDailyAnalysisLimit } from "@/domain/rules/daily-limits";
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
    private readonly dailyUsageRepository: DailyUsageRepository,
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(input: FinishConversationInput): Promise<FinishConversationResult> {
    const conversation = await this.conversationRepository.findById(input.conversationId);

    if (!conversation || conversation.userId !== input.userId) {
      throw new Error("Conversation not found.");
    }
    if (conversation.status !== "active") {
      throw new Error("This conversation is already finished.");
    }

    await this.assertWithinDailyAnalysisLimit(input.userId);

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

  private async assertWithinDailyAnalysisLimit(userId: string): Promise<void> {
    const [profile, usage] = await Promise.all([
      this.userProfileRepository.getById(userId),
      this.dailyUsageRepository.getTodayUsage(userId),
    ]);
    const limit = getDailyAnalysisLimit(profile?.preferences ?? {});
    if (usage.conversationsFinished >= limit) {
      throw new Error("Daily analysis limit reached. Try again tomorrow.");
    }
  }
}
