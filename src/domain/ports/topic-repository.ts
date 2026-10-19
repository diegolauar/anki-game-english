import type { Topic } from "@/domain/entities/topic";

export interface TopicRepository {
  listActive(): Promise<Topic[]>;
}
