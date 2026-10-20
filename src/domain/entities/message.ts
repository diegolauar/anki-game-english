import type { InputMode } from "@/domain/value-objects/input-mode";
import type { MessageRole } from "@/domain/value-objects/message-role";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  inputMode: InputMode;
  sequence: number;
  clientMessageId: string;
  createdAt: string;
}
