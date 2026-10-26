import type { Topic } from "@/domain/entities/topic";
import type { Locale } from "@/domain/value-objects/locale";

export interface TopicRepository {
  listActive(locale: Locale): Promise<Topic[]>;
  findById(id: string, locale: Locale): Promise<Topic | null>;
}
