import type { Topic } from "@/domain/entities/topic";
import type { UserProfile } from "@/domain/entities/user-profile";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";
import type { XpEventRepository } from "@/domain/ports/xp-event-repository";
import { calculateStreak } from "@/domain/rules/calculate-streak";

export interface GetDashboardResult {
  profile: UserProfile | null;
  topics: Topic[];
  pendingReviewCount: number;
  totalXp: number;
  streak: number;
}

export class GetDashboard {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly topicRepository: TopicRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
    private readonly xpEventRepository: XpEventRepository,
  ) {}

  async execute(userId: string): Promise<GetDashboardResult> {
    const [profile, topics, dueFlashcards, totalXp, activeDateKeys] = await Promise.all([
      this.userProfileRepository.getById(userId),
      this.topicRepository.listActive(),
      this.cardScheduleRepository.listDueForUser(userId, new Date()),
      this.xpEventRepository.sumByUser(userId),
      this.xpEventRepository.listActiveDateKeysByUser(userId),
    ]);

    return {
      profile,
      topics,
      pendingReviewCount: dueFlashcards.length,
      totalXp,
      streak: calculateStreak(activeDateKeys, new Date()),
    };
  }
}
