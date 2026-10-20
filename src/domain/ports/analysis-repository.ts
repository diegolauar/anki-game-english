import type { Analysis } from "@/domain/entities/analysis";

/** Somente leitura — as policies de RLS só permitem SELECT para o próprio usuário. */
export interface AnalysisRepository {
  findById(id: string): Promise<Analysis | null>;
  findLatestByConversationId(conversationId: string): Promise<Analysis | null>;
}
