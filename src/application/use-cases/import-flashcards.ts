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

type RowOutcome =
  | { ok: true; flashcard: Flashcard }
  | { ok: false; failure: ImportFlashcardsFailure };

/**
 * Cada linha faz 3 gravações sequenciais no Supabase (flashcard, card_schedule,
 * xp_event) via CreateManualFlashcard — processar as linhas uma após a outra
 * fazia o tempo total crescer linearmente com o nº de linhas (até 100 linhas x
 * 3 round-trips = lentidão perceptível). Processa um lote de linhas por vez em
 * paralelo em vez de todas de uma vez, pra não estourar o limite de conexões
 * simultâneas do Supabase.
 */
const IMPORT_CONCURRENCY = 8;

export class ImportFlashcards {
  constructor(private readonly createManualFlashcard: CreateManualFlashcard) {}

  async execute({ userId, rows }: ImportFlashcardsInput): Promise<ImportFlashcardsResult> {
    const outcomes: RowOutcome[] = new Array(rows.length);

    for (let start = 0; start < rows.length; start += IMPORT_CONCURRENCY) {
      const batch = rows.slice(start, start + IMPORT_CONCURRENCY);
      const batchOutcomes = await Promise.all(
        batch.map((row) => this.executeRow(userId, row)),
      );
      batchOutcomes.forEach((outcome, offset) => {
        outcomes[start + offset] = outcome;
      });
    }

    const created: Flashcard[] = [];
    const failed: ImportFlashcardsFailure[] = [];
    for (const outcome of outcomes) {
      if (outcome.ok) created.push(outcome.flashcard);
      else failed.push(outcome.failure);
    }

    return { created, failed };
  }

  private async executeRow(userId: string, row: ParsedFlashcardRow): Promise<RowOutcome> {
    try {
      const flashcard = await this.createManualFlashcard.execute({
        userId,
        front: row.front,
        back: row.back,
        explanation: row.explanation,
      });
      return { ok: true, flashcard };
    } catch (error) {
      return {
        ok: false,
        failure: {
          line: row.line,
          message: error instanceof Error ? error.message : "Erro desconhecido.",
        },
      };
    }
  }
}
