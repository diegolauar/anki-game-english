import type { LlmUsageSource } from "@/domain/value-objects/llm-usage-source";

export interface LlmUsageLog {
  id: string;
  userId: string;
  source: LlmUsageSource;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
}
