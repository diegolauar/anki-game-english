import type { Message } from "@/domain/entities/message";
import type { InputMode } from "@/domain/value-objects/input-mode";
import type { MessageRole } from "@/domain/value-objects/message-role";

export interface CreateMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  inputMode: InputMode;
  clientMessageId: string;
}

export interface MessageRepository {
  listByConversation(conversationId: string): Promise<Message[]>;
  findByClientMessageId(conversationId: string, clientMessageId: string): Promise<Message | null>;
  create(input: CreateMessageInput): Promise<Message>;
  countByConversation(conversationId: string): Promise<number>;
}
