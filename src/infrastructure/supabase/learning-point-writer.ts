import type { LearningPoint } from "@/domain/entities/learning-point";
import type {
  CreateLearningPointInput,
  LearningPointWriter,
} from "@/domain/ports/learning-point-writer";
import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";
import {
  LEARNING_POINT_COLUMNS,
  toLearningPoint,
} from "@/infrastructure/supabase/learning-point-repository";

/** Escreve em `learning_points`, que só tem policy de RLS para SELECT — exige a service_role. */
export class SupabaseLearningPointWriter implements LearningPointWriter {
  constructor(private readonly client: ServiceRoleSupabaseClient) {}

  async create(input: CreateLearningPointInput): Promise<LearningPoint> {
    const { data, error } = await this.client
      .from("learning_points")
      .insert({
        user_id: input.userId,
        kind: input.kind,
        category: input.category,
        rule_key: input.ruleKey,
        canonical_correction: input.canonicalCorrection,
        explanation: input.explanation,
      })
      .select(LEARNING_POINT_COLUMNS)
      .single();

    if (error) throw error;
    return toLearningPoint(data);
  }

  async incrementOccurrence(id: string): Promise<LearningPoint> {
    const { data: current, error: fetchError } = await this.client
      .from("learning_points")
      .select(LEARNING_POINT_COLUMNS)
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await this.client
      .from("learning_points")
      .update({
        occurrence_count: current.occurrence_count + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(LEARNING_POINT_COLUMNS)
      .single();

    if (error) throw error;
    return toLearningPoint(data);
  }
}
