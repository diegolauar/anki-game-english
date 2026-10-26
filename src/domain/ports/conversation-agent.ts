import type { Difficulty } from "@/domain/value-objects/difficulty";
import type { Locale } from "@/domain/value-objects/locale";
import type { MessageRole } from "@/domain/value-objects/message-role";

export interface ConversationTurn {
  role: MessageRole;
  content: string;
}

export interface ConversationReplyInput {
  topic: string;
  difficulty: Difficulty;
  history: ConversationTurn[];
  /** Idioma de interface do usuário — usado só pra enquadrar o contexto do prompt (seção 5.1); a resposta sempre sai em inglês. */
  locale: Locale;
}

export interface ConversationAgent {
  reply(input: ConversationReplyInput): Promise<string>;
}
