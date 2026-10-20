import type { SupabaseClient } from "@supabase/supabase-js";
import type { Analysis, AnalysisSummary } from "@/domain/entities/analysis";
import type {
  AnalysisRepository,
  MarkAnalysisCompletedInput,
} from "@/domain/ports/analysis-repository";
import type { AnalysisStatus } from "@/domain/value-objects/analysis-status";
import type { Database, Json } from "@/infrastructure/supabase/database.types";

type AnalysisRow = Pick<
  Database["public"]["Tables"]["analyses"]["Row"],
  "id" | "conversation_id" | "status" | "attempts" | "model" | "error_message" | "summary" | "created_at" | "completed_at"
>;

const ANALYSIS_COLUMNS =
  "id, conversation_id, status, attempts, model, error_message, summary, created_at, completed_at";

function toAnalysis(row: AnalysisRow): Analysis {
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

  async create(conversationId: string): Promise<Analysis> {
    const { data, error } = await this.client
      .from("analyses")
      .insert({ conversation_id: conversationId })
      .select(ANALYSIS_COLUMNS)
      .single();

    if (error) throw error;
    return toAnalysis(data);
  }

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

  async markProcessing(id: string): Promise<void> {
    const current = await this.findById(id);
    const { error } = await this.client
      .from("analyses")
      .update({ status: "processing", attempts: (current?.attempts ?? 0) + 1 })
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
