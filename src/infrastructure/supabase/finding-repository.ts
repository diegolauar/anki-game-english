import type { SupabaseClient } from "@supabase/supabase-js";
import type { Finding } from "@/domain/entities/finding";
import type { CreateFindingInput, FindingRepository } from "@/domain/ports/finding-repository";
import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";
import type { Severity } from "@/domain/value-objects/severity";
import type { Database } from "@/infrastructure/supabase/database.types";

type FindingRow = Pick<
  Database["public"]["Tables"]["findings"]["Row"],
  | "id"
  | "analysis_id"
  | "message_id"
  | "learning_point_id"
  | "kind"
  | "severity"
  | "category"
  | "start_offset"
  | "end_offset"
  | "original_text"
  | "correction"
  | "explanation"
  | "example"
  | "created_at"
>;

const FINDING_COLUMNS =
  "id, analysis_id, message_id, learning_point_id, kind, severity, category, start_offset, end_offset, original_text, correction, explanation, example, created_at";

function toFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    messageId: row.message_id,
    learningPointId: row.learning_point_id,
    kind: row.kind as FindingKind,
    severity: row.severity as Severity,
    category: row.category as FindingCategory,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    originalText: row.original_text,
    correction: row.correction,
    explanation: row.explanation,
    example: row.example,
    createdAt: row.created_at,
  };
}

export class SupabaseFindingRepository implements FindingRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateFindingInput): Promise<Finding> {
    const { data, error } = await this.client
      .from("findings")
      .insert({
        analysis_id: input.analysisId,
        message_id: input.messageId,
        learning_point_id: input.learningPointId,
        kind: input.kind,
        severity: input.severity,
        category: input.category,
        start_offset: input.startOffset,
        end_offset: input.endOffset,
        original_text: input.originalText,
        correction: input.correction,
        explanation: input.explanation,
        example: input.example,
      })
      .select(FINDING_COLUMNS)
      .single();

    if (error) throw error;
    return toFinding(data);
  }

  async listByAnalysisId(analysisId: string): Promise<Finding[]> {
    const { data, error } = await this.client
      .from("findings")
      .select(FINDING_COLUMNS)
      .eq("analysis_id", analysisId);

    if (error) throw error;
    return data.map(toFinding);
  }
}
