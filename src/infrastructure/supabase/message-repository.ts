import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "@/domain/entities/message";
import type { CreateMessageInput, MessageRepository } from "@/domain/ports/message-repository";
import type { InputMode } from "@/domain/value-objects/input-mode";
import type { MessageRole } from "@/domain/value-objects/message-role";
import type { Database } from "@/infrastructure/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

const MESSAGE_COLUMNS =
  "id, conversation_id, role, content, input_mode, sequence, client_message_id, created_at";

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as MessageRole,
    content: row.content,
    inputMode: row.input_mode as InputMode,
    sequence: row.sequence,
    clientMessageId: row.client_message_id,
    createdAt: row.created_at,
  };
}

export class SupabaseMessageRepository implements MessageRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listByConversation(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .eq("conversation_id", conversationId)
      .order("sequence", { ascending: true });

    if (error) throw error;
    return data.map(toMessage);
  }

  async findByClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null> {
    const { data, error } = await this.client
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .eq("conversation_id", conversationId)
      .eq("client_message_id", clientMessageId)
      .maybeSingle();

    if (error) throw error;
    return data ? toMessage(data) : null;
  }

  async create(input: CreateMessageInput): Promise<Message> {
    const sequence = await this.nextSequence(input.conversationId);

    const { data, error } = await this.client
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        input_mode: input.inputMode,
        sequence,
        client_message_id: input.clientMessageId,
      })
      .select(MESSAGE_COLUMNS)
      .single();

    if (error) throw error;
    return toMessage(data);
  }

  private async nextSequence(conversationId: string): Promise<number> {
    const { data, error } = await this.client
      .from("messages")
      .select("sequence")
      .eq("conversation_id", conversationId)
      .order("sequence", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.sequence ?? 0) + 1;
  }
}
