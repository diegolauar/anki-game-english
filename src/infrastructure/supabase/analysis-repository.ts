import type { SupabaseClient } from "@supabase/supabase-js";
import type { Analysis, AnalysisSummary } from "@/domain/entities/analysis";
import type { AnalysisRepository } from "@/domain/ports/analysis-repository";
import type { AnalysisStatus } from "@/domain/value-objects/analysis-status";
import type { Database } from "@/infrastructure/supabase/database.types";

export type AnalysisRow = Pick<
  Database["public"]["Tables"]["analyses"]["Row"],
  "id" | "conversation_id" | "status" | "attempts" | "model" | "error_message" | "summary" | "created_at" | "completed_at"
>;

export const ANALYSIS_COLUMNS =
  "id, conversation_id, status, attempts, model, error_message, summary, created_at, completed_at";

export function toAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    status: row.status as AnalysisStatus,
    attempts: row.attempts,
    model: row.model,
    errorMessage: row.error_message,
    summary: (row.summary as unknown as AnalysisSummary | null) ?? null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export class SupabaseAnalysisRepository implements AnalysisRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Analysis | null> {
    const { data, error } = await this.client
      .from("analyses")
      .select(ANALYSIS_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toAnalysis(data) : null;
  }

  async findLatestByConversationId(conversationId: string): Promise<Analysis | null> {
    const { data, error } = await this.client
      .from("analyses")
      .select(ANALYSIS_COLUMNS)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? toAnalysis(data) : null;
  }
}
