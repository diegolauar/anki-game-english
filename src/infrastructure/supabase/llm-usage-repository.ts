import type { SupabaseClient } from "@supabase/supabase-js";
import type { LogLlmUsageInput, LlmUsageRepository } from "@/domain/ports/llm-usage-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseLlmUsageRepository implements LlmUsageRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async log(input: LogLlmUsageInput): Promise<void> {
    const { error } = await this.client.from("llm_usage_logs").insert({
      user_id: input.userId,
      source: input.source,
      model: input.model,
      prompt_tokens: input.promptTokens,
      completion_tokens: input.completionTokens,
      total_tokens: input.totalTokens,
    });

    // Log de uso é telemetria, não deve derrubar a conversa/análise se falhar.
    if (error) console.error("Failed to log LLM usage:", error);
  }
}
