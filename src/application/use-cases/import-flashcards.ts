import type { CreateManualFlashcard } from "@/application/use-cases/create-manual-flashcard";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { ParsedFlashcardRow } from "@/domain/rules/parse-flashcard-csv";

export interface ImportFlashcardsInput {
  userId: string;
  rows: ParsedFlashcardRow[];
}

export interface ImportFlashcardsFailure {
  line: number;
  message: string;
}

export interface ImportFlashcardsResult {
  created: Flashcard[];
  failed: ImportFlashcardsFailure[];
}

export class ImportFlashcards {
  constructor(private readonly createManualFlashcard: CreateManualFlashcard) {}

  async execute({ userId, rows }: ImportFlashcardsInput): Promise<ImportFlashcardsResult> {
    const created: Flashcard[] = [];
    const failed: ImportFlashcardsFailure[] = [];

    for (const row of rows) {
      try {
        const flashcard = await this.createManualFlashcard.execute({
          userId,
          front: row.front,
          back: row.back,
          explanation: row.explanation,
        });
        created.push(flashcard);
      } catch (error) {
        failed.push({
          line: row.line,
          message: error instanceof Error ? error.message : "Erro desconhecido.",
        });
      }
    }

    return { created, failed };
  }
}
