import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningPoint } from "@/domain/entities/learning-point";
import type {
  CreateLearningPointInput,
  LearningPointRepository,
} from "@/domain/ports/learning-point-repository";
import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";
import type { Database } from "@/infrastructure/supabase/database.types";

type LearningPointRow = Pick<
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

const LEARNING_POINT_COLUMNS =
  "id, user_id, kind, category, rule_key, canonical_correction, explanation, occurrence_count, first_seen_at, last_seen_at";

function toLearningPoint(row: LearningPointRow): LearningPoint {
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
}
