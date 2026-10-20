import type { Finding } from "@/domain/entities/finding";
import type { CreateFindingInput, FindingWriter } from "@/domain/ports/finding-writer";
import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";
import { FINDING_COLUMNS, toFinding } from "@/infrastructure/supabase/finding-repository";

/** Escreve em `findings`, que só tem policy de RLS para SELECT — exige a service_role. */
export class SupabaseFindingWriter implements FindingWriter {
  constructor(private readonly client: ServiceRoleSupabaseClient) {}

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
}
