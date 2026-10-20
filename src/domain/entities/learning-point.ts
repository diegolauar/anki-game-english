import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";

export interface LearningPoint {
  id: string;
  userId: string;
  kind: FindingKind;
  category: FindingCategory;
  ruleKey: string;
  canonicalCorrection: string | null;
  explanation: string | null;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}
