import type { LearningPoint } from "@/domain/entities/learning-point";
import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";

export interface CreateLearningPointInput {
  userId: string;
  kind: FindingKind;
  category: FindingCategory;
  ruleKey: string;
  canonicalCorrection: string | null;
  explanation: string | null;
}

export interface LearningPointRepository {
  findByUserAndRuleKey(userId: string, ruleKey: string): Promise<LearningPoint | null>;
  create(input: CreateLearningPointInput): Promise<LearningPoint>;
  incrementOccurrence(id: string): Promise<LearningPoint>;
  listRuleKeysByUser(userId: string): Promise<string[]>;
  listTopByUser(userId: string, limit: number): Promise<LearningPoint[]>;
}
