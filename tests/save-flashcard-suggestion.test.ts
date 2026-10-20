import { describe, expect, it } from "vitest";
import { SaveFlashcardSuggestion } from "@/application/use-cases/save-flashcard-suggestion";
import { SaveFlashcardSuggestions } from "@/application/use-cases/save-flashcard-suggestions";
import type { Flashcard } from "@/domain/entities/flashcard";
import {
  FakeCardScheduleRepository,
  FakeFlashcardRepository,
  FakeReviewScheduler,
  FakeXpEventRepository,
} from "./fakes";

function buildSuggestedFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "flashcard-1",
    userId: "user-1",
    learningPointId: "learning-point-1",
    sourceFindingId: "finding-1",
    cardType: "production",
    front: "Como digo que trabalhei muito ontem?",
    back: "I worked a lot yesterday.",
    explanation: null,
    status: "suggested",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildUseCase() {
  const flashcardRepository = new FakeFlashcardRepository();
  const cardScheduleRepository = new FakeCardScheduleRepository();
  const reviewScheduler = new FakeReviewScheduler();
  const xpEventRepository = new FakeXpEventRepository();
  const useCase = new SaveFlashcardSuggestion(
    flashcardRepository,
    flashcardRepository,
    cardScheduleRepository,
    reviewScheduler,
    xpEventRepository,
  );
  return { useCase, flashcardRepository, cardScheduleRepository, reviewScheduler, xpEventRepository };
}

describe("SaveFlashcardSuggestion", () => {
  it("throws when the flashcard does not exist", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ flashcardId: "missing", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("throws when the flashcard belongs to another user", async () => {
    const { useCase, flashcardRepository } = buildUseCase();
    flashcardRepository.seed(buildSuggestedFlashcard());

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "someone-else" }),
    ).rejects.toThrow();
  });

  it("throws when the flashcard is not in suggested status", async () => {
    const { useCase, flashcardRepository } = buildUseCase();
    flashcardRepository.seed(buildSuggestedFlashcard({ status: "active" }));

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" }),
    ).rejects.toThrow();
  });

  it("activates the flashcard, creates its initial schedule, and awards XP", async () => {
    const { useCase, flashcardRepository, cardScheduleRepository, xpEventRepository } =
      buildUseCase();
    flashcardRepository.seed(buildSuggestedFlashcard());

    const result = await useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" });

    expect(result.status).toBe("active");
    const schedule = await cardScheduleRepository.findByFlashcardId("flashcard-1");
    expect(schedule).not.toBeNull();
    expect(schedule?.state).toBe("new");

    expect(xpEventRepository.events).toHaveLength(1);
    expect(xpEventRepository.events[0]).toMatchObject({
      userId: "user-1",
      sourceType: "flashcard_saved",
      sourceId: "flashcard-1",
      amount: 2,
    });
  });

  it("applies edits to front/back/explanation before activating", async () => {
    const { useCase, flashcardRepository } = buildUseCase();
    flashcardRepository.seed(buildSuggestedFlashcard());

    const result = await useCase.execute({
      flashcardId: "flashcard-1",
      userId: "user-1",
      front: "Edited front",
      back: "Edited back",
      explanation: "Edited explanation",
    });

    expect(result.front).toBe("Edited front");
    expect(result.back).toBe("Edited back");
    expect(result.explanation).toBe("Edited explanation");
  });
});

describe("SaveFlashcardSuggestions", () => {
  it("saves every flashcard id in the list", async () => {
    const { useCase: singleUseCase, flashcardRepository } = buildUseCase();
    flashcardRepository.seed(buildSuggestedFlashcard({ id: "flashcard-1" }));
    flashcardRepository.seed(buildSuggestedFlashcard({ id: "flashcard-2" }));

    const bulkUseCase = new SaveFlashcardSuggestions(singleUseCase);
    const results = await bulkUseCase.execute({
      flashcardIds: ["flashcard-1", "flashcard-2"],
      userId: "user-1",
    });

    expect(results).toHaveLength(2);
    expect(results.every((flashcard) => flashcard.status === "active")).toBe(true);
  });
});
