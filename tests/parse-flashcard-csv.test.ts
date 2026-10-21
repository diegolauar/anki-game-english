import { describe, expect, it } from "vitest";
import { MAX_FLASHCARD_IMPORT_ROWS, parseFlashcardCsv } from "@/domain/rules/parse-flashcard-csv";

describe("parseFlashcardCsv", () => {
  it("parses front/back/explanation rows", () => {
    const csv = `front,back,explanation
"How do I say ""bom dia""?",Good morning,
I worked a lot yesterday,I worked a lot yesterday,Simple Past`;

    const { rows, errors } = parseFlashcardCsv(csv);

    expect(errors).toHaveLength(0);
    expect(rows).toEqual([
      { line: 2, front: 'How do I say "bom dia"?', back: "Good morning", explanation: null },
      {
        line: 3,
        front: "I worked a lot yesterday",
        back: "I worked a lot yesterday",
        explanation: "Simple Past",
      },
    ]);
  });

  it("auto-detects semicolon as the delimiter (bloco de notas / Excel pt-BR)", () => {
    const txt = "front;back;explanation\nHello;Olá;saudação informal";

    const { rows, errors } = parseFlashcardCsv(txt);

    expect(errors).toHaveLength(0);
    expect(rows).toEqual([{ line: 2, front: "Hello", back: "Olá", explanation: "saudação informal" }]);
  });

  it("auto-detects tab as the delimiter", () => {
    const txt = "front\tback\nHello\tOlá";

    const { rows, errors } = parseFlashcardCsv(txt);

    expect(errors).toHaveLength(0);
    expect(rows).toEqual([{ line: 2, front: "Hello", back: "Olá", explanation: null }]);
  });

  it("works without the optional explanation column", () => {
    const { rows, errors } = parseFlashcardCsv("front,back\nHello,Olá");

    expect(errors).toHaveLength(0);
    expect(rows).toEqual([{ line: 2, front: "Hello", back: "Olá", explanation: null }]);
  });

  it("rejects a header missing front or back", () => {
    const { rows, errors } = parseFlashcardCsv("question,answer\nHello,Olá");

    expect(rows).toHaveLength(0);
    expect(errors[0]?.message).toContain("front");
  });

  it("rejects an empty file", () => {
    const { rows, errors } = parseFlashcardCsv("");

    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("skips rows missing front or back but keeps the valid ones", () => {
    const csv = "front,back\nHello,Olá\n,Missing front\nBye,";

    const { rows, errors } = parseFlashcardCsv(csv);

    expect(rows).toEqual([{ line: 2, front: "Hello", back: "Olá", explanation: null }]);
    expect(errors).toHaveLength(2);
    expect(errors[0].line).toBe(3);
    expect(errors[1].line).toBe(4);
  });

  it("caps the number of imported rows", () => {
    const lines = Array.from({ length: MAX_FLASHCARD_IMPORT_ROWS + 5 }, (_, i) => `f${i},b${i}`);
    const csv = `front,back\n${lines.join("\n")}`;

    const { rows, errors } = parseFlashcardCsv(csv);

    expect(rows).toHaveLength(MAX_FLASHCARD_IMPORT_ROWS);
    expect(errors.at(-1)?.message).toContain("Limite");
  });
});
