import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningPoint } from "@/domain/entities/learning-point";
import type { LearningPointRepository } from "@/domain/ports/learning-point-repository";
import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";
import type { Database } from "@/infrastructure/supabase/database.types";

export type LearningPointRow = Pick<
  Database["public"]["Tables"]["learning_points"]["Row"],
  | "id"
  | "user_id"
  | "kind"
  | "category"
  | "rule_key"
  | "canonical_correction"
  | "explanation"
  | "occurrence_count"
  | "first_seen_at"
  | "last_seen_at"
>;

export const LEARNING_POINT_COLUMNS =
  "id, user_id, kind, category, rule_key, canonical_correction, explanation, occurrence_count, first_seen_at, last_seen_at";

export function toLearningPoint(row: LearningPointRow): LearningPoint {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as FindingKind,
    category: row.category as FindingCategory,
    ruleKey: row.rule_key,
    canonicalCorrection: row.canonical_correction,
    explanation: row.explanation,
    occurrenceCount: row.occurrence_count,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

export class SupabaseLearningPointRepository implements LearningPointRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByUserAndRuleKey(userId: string, ruleKey: string): Promise<LearningPoint | null> {
    const { data, error } = await this.client
      .from("learning_points")
      .select(LEARNING_POINT_COLUMNS)
      .eq("user_id", userId)
      .eq("rule_key", ruleKey)
      .maybeSingle();

    if (error) throw error;
    return data ? toLearningPoint(data) : null;
  }

  async listRuleKeysByUser(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("learning_points")
      .select("rule_key")
      .eq("user_id", userId);

    if (error) throw error;
    return data.map((row) => row.rule_key);
  }

  async listTopByUser(userId: string, limit: number): Promise<LearningPoint[]> {
    const { data, error } = await this.client
      .from("learning_points")
      .select(LEARNING_POINT_COLUMNS)
      .eq("user_id", userId)
      .order("occurrence_count", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(toLearningPoint);
  }

  async listByIds(ids: string[]): Promise<LearningPoint[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.client
      .from("learning_points")
      .select(LEARNING_POINT_COLUMNS)
      .in("id", ids);

    if (error) throw error;
    return data.map(toLearningPoint);
  }
}
