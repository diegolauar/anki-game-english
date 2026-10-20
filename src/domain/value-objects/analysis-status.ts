export const ANALYSIS_STATUSES = ["pending", "processing", "completed", "failed"] as const;

export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];
