import { describe, expect, it } from "vitest";
import { DiscardFlashcardSuggestion } from "@/application/use-cases/discard-flashcard-suggestion";
import type { Flashcard } from "@/domain/entities/flashcard";
import { FakeFlashcardRepository } from "./fakes";

function buildSuggestedFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "flashcard-1",
    userId: "user-1",
    learningPointId: "learning-point-1",
    sourceFindingId: "finding-1",
    cardType: "production",
    front: "front",
    back: "back",
    explanation: null,
    status: "suggested",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("DiscardFlashcardSuggestion", () => {
  it("throws when the flashcard belongs to another user", async () => {
    const flashcardRepository = new FakeFlashcardRepository();
    flashcardRepository.seed(buildSuggestedFlashcard());
    const useCase = new DiscardFlashcardSuggestion(flashcardRepository);

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "someone-else" }),
    ).rejects.toThrow();
  });

  it("throws when the flashcard is not suggested", async () => {
    const flashcardRepository = new FakeFlashcardRepository();
    flashcardRepository.seed(buildSuggestedFlashcard({ status: "active" }));
    const useCase = new DiscardFlashcardSuggestion(flashcardRepository);

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("marks the flashcard as discarded", async () => {
    const flashcardRepository = new FakeFlashcardRepository();
    flashcardRepository.seed(buildSuggestedFlashcard());
    const useCase = new DiscardFlashcardSuggestion(flashcardRepository);

    await useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" });

    const flashcard = await flashcardRepository.findById("flashcard-1");
    expect(flashcard?.status).toBe("discarded");
  });
});
