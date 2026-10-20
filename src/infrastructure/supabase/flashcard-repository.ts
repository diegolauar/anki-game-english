import type { SupabaseClient } from "@supabase/supabase-js";
import type { Flashcard } from "@/domain/entities/flashcard";
import type {
  CreateManualFlashcardInput,
  CreateSuggestedFlashcardInput,
  FlashcardContentUpdate,
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

export const FLASHCARD_COLUMNS =
  "id, user_id, learning_point_id, source_finding_id, card_type, front, back, explanation, status, created_at, updated_at";

export function toFlashcard(row: FlashcardRow): Flashcard {
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

  async createManual(input: CreateManualFlashcardInput): Promise<Flashcard> {
    const { data, error } = await this.client
      .from("flashcards")
      .insert({
        user_id: input.userId,
        card_type: "manual",
        front: input.front,
        back: input.back,
        explanation: input.explanation,
        status: "active",
      })
      .select(FLASHCARD_COLUMNS)
      .single();

    if (error) throw error;
    return toFlashcard(data);
  }

  async findById(id: string): Promise<Flashcard | null> {
    const { data, error } = await this.client
      .from("flashcards")
      .select(FLASHCARD_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toFlashcard(data) : null;
  }

  async listBySourceFindingIds(findingIds: string[]): Promise<Flashcard[]> {
    if (findingIds.length === 0) return [];

    const { data, error } = await this.client
      .from("flashcards")
      .select(FLASHCARD_COLUMNS)
      .in("source_finding_id", findingIds);

    if (error) throw error;
    return data.map(toFlashcard);
  }

  async listByUser(userId: string, status?: FlashcardStatus): Promise<Flashcard[]> {
    let query = this.client.from("flashcards").select(FLASHCARD_COLUMNS).eq("user_id", userId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toFlashcard);
  }

  async activate(id: string, overrides: FlashcardContentUpdate): Promise<Flashcard> {
    const { data, error } = await this.client
      .from("flashcards")
      .update({
        status: "active",
        ...(overrides.front !== undefined ? { front: overrides.front } : {}),
        ...(overrides.back !== undefined ? { back: overrides.back } : {}),
        ...(overrides.explanation !== undefined ? { explanation: overrides.explanation } : {}),
      })
      .eq("id", id)
      .select(FLASHCARD_COLUMNS)
      .single();

    if (error) throw error;
    return toFlashcard(data);
  }

  async discard(id: string): Promise<Flashcard> {
    const { data, error } = await this.client
      .from("flashcards")
      .update({ status: "discarded" })
      .eq("id", id)
      .select(FLASHCARD_COLUMNS)
      .single();

    if (error) throw error;
    return toFlashcard(data);
  }

  async updateContent(id: string, update: FlashcardContentUpdate): Promise<Flashcard> {
    const { data, error } = await this.client
      .from("flashcards")
      .update({
        ...(update.front !== undefined ? { front: update.front } : {}),
        ...(update.back !== undefined ? { back: update.back } : {}),
        ...(update.explanation !== undefined ? { explanation: update.explanation } : {}),
      })
      .eq("id", id)
      .select(FLASHCARD_COLUMNS)
      .single();

    if (error) throw error;
    return toFlashcard(data);
  }

  async setStatus(id: string, status: "active" | "suspended"): Promise<Flashcard> {
    const { data, error } = await this.client
      .from("flashcards")
      .update({ status })
      .eq("id", id)
      .select(FLASHCARD_COLUMNS)
      .single();

    if (error) throw error;
    return toFlashcard(data);
  }
}
