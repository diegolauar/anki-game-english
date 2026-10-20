import type { Analysis, AnalysisSummary } from "@/domain/entities/analysis";

export interface MarkAnalysisCompletedInput {
  model: string;
  summary: AnalysisSummary;
}

export interface AnalysisRepository {
  create(conversationId: string): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  findLatestByConversationId(conversationId: string): Promise<Analysis | null>;
  markProcessing(id: string): Promise<void>;
  markCompleted(id: string, input: MarkAnalysisCompletedInput): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
}
