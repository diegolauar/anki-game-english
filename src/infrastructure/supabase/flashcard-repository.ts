import type { SupabaseClient } from "@supabase/supabase-js";
import type { Flashcard } from "@/domain/entities/flashcard";
import type {
  CreateSuggestedFlashcardInput,
  FlashcardRepository,
} from "@/domain/ports/flashcard-repository";
import type { CardType } from "@/domain/value-objects/card-type";
import type { FlashcardStatus } from "@/domain/value-objects/flashcard-status";
import type { Database } from "@/infrastructure/supabase/database.types";

type FlashcardRow = Pick<
  Database["public"]["Tables"]["flashcards"]["Row"],
  | "id"
  | "user_id"
  | "learning_point_id"
  | "source_finding_id"
  | "card_type"
  | "front"
  | "back"
  | "explanation"
  | "status"
  | "created_at"
  | "updated_at"
>;

const FLASHCARD_COLUMNS =
  "id, user_id, learning_point_id, source_finding_id, card_type, front, back, explanation, status, created_at, updated_at";

function toFlashcard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    userId: row.user_id,
    learningPointId: row.learning_point_id,
    sourceFindingId: row.source_finding_id,
    cardType: row.card_type as CardType,
    front: row.front,
    back: row.back,
    explanation: row.explanation,
    status: row.status as FlashcardStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseFlashcardRepository implements FlashcardRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async hasActiveForLearningPoint(learningPointId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("flashcards")
      .select("id")
      .eq("learning_point_id", learningPointId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  async createSuggested(input: CreateSuggestedFlashcardInput): Promise<Flashcard> {
    const { data, error } = await this.client
      .from("flashcards")
      .insert({
        user_id: input.userId,
        learning_point_id: input.learningPointId,
        source_finding_id: input.sourceFindingId,
        card_type: input.cardType,
        front: input.front,
        back: input.back,
        explanation: input.explanation,
        status: "suggested",
      })
      .select(FLASHCARD_COLUMNS)
      .single();

    if (error) throw error;
    return toFlashcard(data);
  }
}
