export const MAX_FLASHCARD_IMPORT_ROWS = 100;

/**
 * Tipagem estrutural mínima pro tradutor do next-intl — não importamos
 * `next-intl` aqui pra manter o domínio livre de dependências externas (seção 3
 * do CLAUDE.md); o tipo real (`useTranslations`/`getTranslations`) satisfaz essa
 * assinatura por duck typing.
 */
export type ParseFlashcardCsvTranslator = (key: string, values?: Record<string, string | number>) => string;

export interface ParsedFlashcardRow {
  line: number;
  front: string;
  back: string;
  explanation: string | null;
}

export interface FlashcardCsvRowError {
  line: number;
  message: string;
}

export interface ParseFlashcardCsvResult {
  rows: ParsedFlashcardRow[];
  errors: FlashcardCsvRowError[];
}

/** Detecta o separador pela linha de cabeçalho: tab > ponto-e-vírgula > vírgula (comum em export de bloco de notas/Excel pt-BR). */
function detectDelimiter(headerLine: string): string {
  const candidates = [
    { delimiter: "\t", count: (headerLine.match(/\t/g) ?? []).length },
    { delimiter: ";", count: (headerLine.match(/;/g) ?? []).length },
    { delimiter: ",", count: (headerLine.match(/,/g) ?? []).length },
  ];
  return candidates.find((candidate) => candidate.count > 0)?.delimiter ?? ",";
}

/** Parser RFC4180 mínimo com separador configurável: aspas duplas para campos com o separador/quebra de linha, "" como aspas literal. */
function splitDelimitedRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      record.push(field);
      field = "";
    } else if (char === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  record.push(field);
  records.push(record);

  return records.filter((row) => !(row.length === 1 && row[0].trim() === ""));
}

/**
 * Converte um arquivo com colunas "front,back,explanation" (explanation opcional) em cartões manuais.
 * Aceita vírgula, ponto-e-vírgula ou tab como separador (detectado pelo cabeçalho) — cobre tanto CSV
 * quanto .txt exportado de bloco de notas/Excel. Regra pura de domínio: nenhuma leitura de arquivo ou I/O aqui.
 */
export function parseFlashcardCsv(
  content: string,
  t: ParseFlashcardCsvTranslator,
): ParseFlashcardCsvResult {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstNewline = normalized.indexOf("\n");
  const headerLine = firstNewline === -1 ? normalized : normalized.slice(0, firstNewline);
  const delimiter = detectDelimiter(headerLine);
  const records = splitDelimitedRecords(normalized, delimiter);

  if (records.length === 0) {
    return { rows: [], errors: [{ line: 1, message: t("emptyFile") }] };
  }

  const header = records[0].map((cell) => cell.trim().toLowerCase());
  const frontIndex = header.indexOf("front");
  const backIndex = header.indexOf("back");
  const explanationIndex = header.indexOf("explanation");

  if (frontIndex === -1 || backIndex === -1) {
    return {
      rows: [],
      errors: [{ line: 1, message: t("missingColumns") }],
    };
  }

  const rows: ParsedFlashcardRow[] = [];
  const errors: FlashcardCsvRowError[] = [];

  for (let index = 1; index < records.length; index += 1) {
    const line = index + 1;

    if (rows.length >= MAX_FLASHCARD_IMPORT_ROWS) {
      errors.push({
        line,
        message: t("rowLimitReached", { max: MAX_FLASHCARD_IMPORT_ROWS }),
      });
      break;
    }

    const record = records[index];
    const front = (record[frontIndex] ?? "").trim();
    const back = (record[backIndex] ?? "").trim();
    const explanation = explanationIndex >= 0 ? (record[explanationIndex] ?? "").trim() : "";

    if (!front || !back) {
      errors.push({ line, message: t("missingFrontOrBack") });
      continue;
    }

    rows.push({ line, front, back, explanation: explanation.length > 0 ? explanation : null });
  }

  return { rows, errors };
}
