import { describe, expect, it } from "vitest";
import { CreateManualFlashcard } from "@/application/use-cases/create-manual-flashcard";
import { ImportFlashcards } from "@/application/use-cases/import-flashcards";
import {
  FakeCardScheduleRepository,
  FakeFlashcardRepository,
  FakeReviewScheduler,
  FakeXpEventRepository,
} from "./fakes";

function buildUseCase() {
  const flashcardRepository = new FakeFlashcardRepository();
  const createManualFlashcard = new CreateManualFlashcard(
    flashcardRepository,
    new FakeCardScheduleRepository(),
    new FakeReviewScheduler(),
    new FakeXpEventRepository(),
  );
  const useCase = new ImportFlashcards(createManualFlashcard);
  return { useCase, flashcardRepository };
}

describe("ImportFlashcards", () => {
  it("creates one manual flashcard per row", async () => {
    const { useCase, flashcardRepository } = buildUseCase();

    const result = await useCase.execute({
      userId: "user-1",
      rows: [
        { line: 2, front: "Hello", back: "Olá", explanation: null },
        { line: 3, front: "Bye", back: "Tchau", explanation: "informal" },
      ],
    });

    expect(result.created).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
    expect(flashcardRepository.flashcards).toHaveLength(2);
    expect(flashcardRepository.flashcards[0].cardType).toBe("manual");
  });

  it("keeps importing after a row fails", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({
      userId: "user-1",
      rows: [
        { line: 2, front: "  ", back: "Olá", explanation: null },
        { line: 3, front: "Bye", back: "Tchau", explanation: null },
      ],
    });

    expect(result.created).toHaveLength(1);
    expect(result.failed).toEqual([{ line: 2, message: expect.any(String) }]);
  });
});
