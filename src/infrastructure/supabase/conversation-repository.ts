import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation } from "@/domain/entities/conversation";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "@/domain/ports/conversation-repository";
import type { ConversationStatus } from "@/domain/value-objects/conversation-status";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import type { Database } from "@/infrastructure/supabase/database.types";

type ConversationRow = Pick<
  Database["public"]["Tables"]["conversations"]["Row"],
  "id" | "user_id" | "topic_id" | "custom_topic" | "difficulty" | "status" | "started_at" | "ended_at"
>;

const CONVERSATION_COLUMNS =
  "id, user_id, topic_id, custom_topic, difficulty, status, started_at, ended_at";

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    topicId: row.topic_id,
    customTopic: row.custom_topic,
    difficulty: row.difficulty as Difficulty,
    status: row.status as ConversationStatus,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

export class SupabaseConversationRepository implements ConversationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateConversationInput): Promise<Conversation> {
    const { data, error } = await this.client
      .from("conversations")
      .insert({
        user_id: input.userId,
        topic_id: input.topicId,
        custom_topic: input.customTopic,
        difficulty: input.difficulty,
      })
      .select(CONVERSATION_COLUMNS)
      .single();

    if (error) throw error;
    return toConversation(data);
  }

  async findById(id: string): Promise<Conversation | null> {
    const { data, error } = await this.client
      .from("conversations")
      .select(CONVERSATION_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toConversation(data) : null;
  }

  async finish(id: string): Promise<void> {
    const { error } = await this.client
      .from("conversations")
      .update({ status: "finished", ended_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  async listRecentByUser(userId: string, limit: number): Promise<Conversation[]> {
    const { data, error } = await this.client
      .from("conversations")
      .select(CONVERSATION_COLUMNS)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(toConversation);
  }
}
