import type { Flashcard } from "@/domain/entities/flashcard";
import type { FlashcardContentUpdate } from "@/domain/ports/flashcard-repository";

export interface CreateSuggestedFlashcardInput {
  userId: string;
  learningPointId: string;
  sourceFindingId: string;
  cardType: "production" | "cloze";
  front: string;
  back: string;
  explanation: string | null;
}

/**
 * Ciclo de vida da sugestão de flashcard nascida na análise pós-conversa
 * (seção 6 do CLAUDE.md): criada pelo pipeline de IA (`AnalyzeConversation`)
 * e depois resolvida pelo usuário na tela de Resultados (salvar ou descartar).
 */
export interface FlashcardSuggestionRepository {
  hasActiveForLearningPoint(learningPointId: string): Promise<boolean>;
  createSuggested(input: CreateSuggestedFlashcardInput): Promise<Flashcard>;
  activate(id: string, overrides: FlashcardContentUpdate): Promise<Flashcard>;
  discard(id: string): Promise<Flashcard>;
}
