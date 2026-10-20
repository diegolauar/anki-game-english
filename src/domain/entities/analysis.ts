import type { AnalysisStatus } from "@/domain/value-objects/analysis-status";

export interface AnalysisSummary {
  mainPoints: string[];
  recommendedExpressions: string[];
}

export interface Analysis {
  id: string;
  conversationId: string;
  status: AnalysisStatus;
  attempts: number;
  model: string | null;
  errorMessage: string | null;
  summary: AnalysisSummary | null;
  createdAt: string;
  completedAt: string | null;
}
