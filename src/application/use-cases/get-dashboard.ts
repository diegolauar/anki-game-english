import type { Topic } from "@/domain/entities/topic";
import type { UserProfile } from "@/domain/entities/user-profile";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";

export interface GetDashboardResult {
  profile: UserProfile | null;
  topics: Topic[];
}

export class GetDashboard {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly topicRepository: TopicRepository,
  ) {}

  async execute(userId: string): Promise<GetDashboardResult> {
    const [profile, topics] = await Promise.all([
      this.userProfileRepository.getById(userId),
      this.topicRepository.listActive(),
    ]);

    return { profile, topics };
  }
}
