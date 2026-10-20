import { describe, expect, it } from "vitest";
import { EditFlashcard } from "@/application/use-cases/edit-flashcard";
import { ToggleFlashcardSuspension } from "@/application/use-cases/toggle-flashcard-suspension";
import type { Flashcard } from "@/domain/entities/flashcard";
import { FakeFlashcardRepository } from "./fakes";

function buildFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "flashcard-1",
    userId: "user-1",
    learningPointId: null,
    sourceFindingId: null,
    cardType: "manual",
    front: "front",
    back: "back",
    explanation: null,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("EditFlashcard", () => {
  it("throws when the flashcard belongs to another user", async () => {
    const repository = new FakeFlashcardRepository();
    repository.seed(buildFlashcard());
    const useCase = new EditFlashcard(repository, repository);

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "someone-else", front: "x" }),
    ).rejects.toThrow();
  });

  it("throws when the flashcard is discarded", async () => {
    const repository = new FakeFlashcardRepository();
    repository.seed(buildFlashcard({ status: "discarded" }));
    const useCase = new EditFlashcard(repository, repository);

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "user-1", front: "x" }),
    ).rejects.toThrow();
  });

  it("updates the flashcard content", async () => {
    const repository = new FakeFlashcardRepository();
    repository.seed(buildFlashcard());
    const useCase = new EditFlashcard(repository, repository);

    const result = await useCase.execute({
      flashcardId: "flashcard-1",
      userId: "user-1",
      front: "new front",
      back: "new back",
    });

    expect(result.front).toBe("new front");
    expect(result.back).toBe("new back");
  });
});

describe("ToggleFlashcardSuspension", () => {
  it("suspends an active flashcard", async () => {
    const repository = new FakeFlashcardRepository();
    repository.seed(buildFlashcard({ status: "active" }));
    const useCase = new ToggleFlashcardSuspension(repository, repository);

    const result = await useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" });

    expect(result.status).toBe("suspended");
  });

  it("reactivates a suspended flashcard", async () => {
    const repository = new FakeFlashcardRepository();
    repository.seed(buildFlashcard({ status: "suspended" }));
    const useCase = new ToggleFlashcardSuspension(repository, repository);

    const result = await useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" });

    expect(result.status).toBe("active");
  });

  it("throws when the flashcard is suggested or discarded", async () => {
    const repository = new FakeFlashcardRepository();
    repository.seed(buildFlashcard({ status: "suggested" }));
    const useCase = new ToggleFlashcardSuspension(repository, repository);

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "user-1" }),
    ).rejects.toThrow();
  });
});
