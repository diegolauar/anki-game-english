import type { LearningPoint } from "@/domain/entities/learning-point";
import type { Topic } from "@/domain/entities/topic";
import type { UserProfile } from "@/domain/entities/user-profile";
import type { AnalysisRepository } from "@/domain/ports/analysis-repository";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { LearningPointRepository } from "@/domain/ports/learning-point-repository";
import type { MessageRepository } from "@/domain/ports/message-repository";
import type { ReviewLogRepository } from "@/domain/ports/review-log-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";
import type { DailyXpTotal, XpEventRepository } from "@/domain/ports/xp-event-repository";
import type { AnalysisStatus } from "@/domain/value-objects/analysis-status";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import { calculateStreak } from "@/domain/rules/calculate-streak";

const RECENT_CONVERSATIONS_LIMIT = 5;
const TOP_LEARNING_POINTS_LIMIT = 3;
const WEEKLY_XP_DAYS = 7;

export interface DashboardConversationSummary {
  id: string;
  title: string;
  category: string | null;
  difficulty: Difficulty;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  analysisStatus: AnalysisStatus | "none";
}

export interface GetDashboardResult {
  profile: UserProfile | null;
  topics: Topic[];
  pendingReviewCount: number;
  reviewedTodayCount: number;
  totalXp: number;
  streak: number;
  weeklyXp: DailyXpTotal[];
  topLearningPoints: LearningPoint[];
  recentConversations: DashboardConversationSummary[];
}

export class GetDashboard {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly topicRepository: TopicRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
    private readonly xpEventRepository: XpEventRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly analysisRepository: AnalysisRepository,
    private readonly learningPointRepository: LearningPointRepository,
    private readonly reviewLogRepository: ReviewLogRepository,
  ) {}

  async execute(userId: string): Promise<GetDashboardResult> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - (WEEKLY_XP_DAYS - 1) * 24 * 60 * 60 * 1000);

    const [
      profile,
      topics,
      dueFlashcards,
      totalXp,
      activeDateKeys,
      weeklyXp,
      topLearningPoints,
      reviewedTodayCount,
      recentConversations,
    ] = await Promise.all([
      this.userProfileRepository.getById(userId),
      this.topicRepository.listActive(),
      this.cardScheduleRepository.listDueForUser(userId, now),
      this.xpEventRepository.sumByUser(userId),
      this.xpEventRepository.listActiveDateKeysByUser(userId),
      this.xpEventRepository.listDailyTotalsByUser(userId, weekAgo),
      this.learningPointRepository.listTopByUser(userId, TOP_LEARNING_POINTS_LIMIT),
      this.reviewLogRepository.countTodayByUser(userId, now),
      this.conversationRepository.listRecentByUser(userId, RECENT_CONVERSATIONS_LIMIT),
    ]);

    const topicById = new Map(topics.map((topic) => [topic.id, topic]));
    const conversationSummaries = await Promise.all(
      recentConversations.map((conversation) =>
        this.summarizeConversation(conversation, topicById),
      ),
    );

    return {
      profile,
      topics,
      pendingReviewCount: dueFlashcards.length,
      reviewedTodayCount,
      totalXp,
      streak: calculateStreak(activeDateKeys, now),
      weeklyXp,
      topLearningPoints,
      recentConversations: conversationSummaries,
    };
  }

  private async summarizeConversation(
    conversation: {
      id: string;
      topicId: string | null;
      customTopic: string | null;
      difficulty: Difficulty;
      startedAt: string;
      endedAt: string | null;
    },
    topicById: Map<string, Topic>,
  ): Promise<DashboardConversationSummary> {
    const [messageCount, analysis] = await Promise.all([
      this.messageRepository.countByConversation(conversation.id),
      this.analysisRepository.findLatestByConversationId(conversation.id),
    ]);

    const topic = conversation.topicId ? topicById.get(conversation.topicId) : undefined;

    return {
      id: conversation.id,
      title: conversation.customTopic ?? topic?.title ?? "Conversa",
      category: topic?.category ?? null,
      difficulty: conversation.difficulty,
      startedAt: conversation.startedAt,
      endedAt: conversation.endedAt,
      messageCount,
      analysisStatus: analysis?.status ?? "none",
    };
  }
}
