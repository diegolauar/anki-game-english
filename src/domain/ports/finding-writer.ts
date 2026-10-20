import type { Finding } from "@/domain/entities/finding";
import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";
import type { Severity } from "@/domain/value-objects/severity";

export interface CreateFindingInput {
  analysisId: string;
  messageId: string;
  learningPointId: string;
  kind: FindingKind;
  severity: Severity;
  category: FindingCategory;
  startOffset: number;
  endOffset: number;
  originalText: string;
  correction: string | null;
  explanation: string | null;
  example: string | null;
}

/**
 * Escrita privilegiada — `findings` só tem policy de RLS para SELECT, então os
 * adaptadores de infraestrutura que implementam esta porta exigem a service_role
 * (ver `ServiceRoleSupabaseClient`).
 */
export interface FindingWriter {
  create(input: CreateFindingInput): Promise<Finding>;
}
