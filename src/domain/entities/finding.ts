import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";
import type { Severity } from "@/domain/value-objects/severity";

export interface Finding {
  id: string;
  analysisId: string;
  messageId: string;
  learningPointId: string | null;
  kind: FindingKind;
  severity: Severity;
  category: FindingCategory;
  startOffset: number;
  endOffset: number;
  originalText: string;
  correction: string | null;
  explanation: string | null;
  example: string | null;
  createdAt: string;
}
