import type { Analysis } from "@/domain/entities/analysis";
import type { AnalysisWriter, MarkAnalysisCompletedInput } from "@/domain/ports/analysis-writer";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";
import { ANALYSIS_COLUMNS, toAnalysis } from "@/infrastructure/supabase/analysis-repository";

/** Escreve em `analyses`, que só tem policy de RLS para SELECT — exige a service_role. */
export class SupabaseAnalysisWriter implements AnalysisWriter {
  constructor(private readonly client: ServiceRoleSupabaseClient) {}

  async create(conversationId: string): Promise<Analysis> {
    const { data, error } = await this.client
      .from("analyses")
      .insert({ conversation_id: conversationId })
      .select(ANALYSIS_COLUMNS)
      .single();

    if (error) throw error;
    return toAnalysis(data);
  }

  async markProcessing(id: string): Promise<void> {
    const { data: current, error: fetchError } = await this.client
      .from("analyses")
      .select("attempts")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await this.client
      .from("analyses")
      .update({ status: "processing", attempts: current.attempts + 1 })
      .eq("id", id);

    if (error) throw error;
  }

  async markCompleted(id: string, input: MarkAnalysisCompletedInput): Promise<void> {
    const { error } = await this.client
      .from("analyses")
      .update({
        status: "completed",
        model: input.model,
        summary: input.summary as unknown as Json,
        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const { error } = await this.client
      .from("analyses")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", id);

    if (error) throw error;
  }
}
