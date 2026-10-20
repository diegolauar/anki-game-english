import type { LearningPoint } from "@/domain/entities/learning-point";

/** Somente leitura — `learning_points` só tem policy de RLS para SELECT do próprio usuário. */
export interface LearningPointRepository {
  findByUserAndRuleKey(userId: string, ruleKey: string): Promise<LearningPoint | null>;
  listRuleKeysByUser(userId: string): Promise<string[]>;
  listTopByUser(userId: string, limit: number): Promise<LearningPoint[]>;
  listByIds(ids: string[]): Promise<LearningPoint[]>;
}
