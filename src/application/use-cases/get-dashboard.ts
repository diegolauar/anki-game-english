import type { Topic } from "@/domain/entities/topic";
import type { UserProfile } from "@/domain/entities/user-profile";
import type { CardScheduleRepository } from "@/domain/ports/card-schedule-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";

export interface GetDashboardResult {
  profile: UserProfile | null;
  topics: Topic[];
  pendingReviewCount: number;
}

export class GetDashboard {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly topicRepository: TopicRepository,
    private readonly cardScheduleRepository: CardScheduleRepository,
  ) {}

  async execute(userId: string): Promise<GetDashboardResult> {
    const [profile, topics, dueFlashcards] = await Promise.all([
      this.userProfileRepository.getById(userId),
      this.topicRepository.listActive(),
      this.cardScheduleRepository.listDueForUser(userId, new Date()),
    ]);

    return { profile, topics, pendingReviewCount: dueFlashcards.length };
  }
}
