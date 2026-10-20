import type { LlmUsageSource } from "@/domain/value-objects/llm-usage-source";

export interface LogLlmUsageInput {
  userId: string;
  source: LlmUsageSource;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmUsageRepository {
  log(input: LogLlmUsageInput): Promise<void>;
}
