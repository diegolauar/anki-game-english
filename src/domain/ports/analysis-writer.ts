import type { Analysis, AnalysisSummary } from "@/domain/entities/analysis";

export interface MarkAnalysisCompletedInput {
  model: string;
  summary: AnalysisSummary;
}

/**
 * Escrita privilegiada — `analyses` só tem policy de RLS para SELECT, então os
 * adaptadores de infraestrutura que implementam esta porta exigem a service_role
 * (ver `ServiceRoleSupabaseClient`).
 */
export interface AnalysisWriter {
  create(conversationId: string): Promise<Analysis>;
  markProcessing(id: string): Promise<void>;
  markCompleted(id: string, input: MarkAnalysisCompletedInput): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
}
