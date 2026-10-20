import { describe, expect, it } from "vitest";
import { CreateManualFlashcard } from "@/application/use-cases/create-manual-flashcard";
import {
  FakeCardScheduleRepository,
  FakeFlashcardRepository,
  FakeReviewScheduler,
  FakeXpEventRepository,
} from "./fakes";

function buildUseCase() {
  const flashcardRepository = new FakeFlashcardRepository();
  const cardScheduleRepository = new FakeCardScheduleRepository();
  const reviewScheduler = new FakeReviewScheduler();
  const xpEventRepository = new FakeXpEventRepository();
  const useCase = new CreateManualFlashcard(
    flashcardRepository,
    cardScheduleRepository,
    reviewScheduler,
    xpEventRepository,
  );
  return { useCase, flashcardRepository, cardScheduleRepository, xpEventRepository };
}

describe("CreateManualFlashcard", () => {
  it("throws when front or back is empty", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ userId: "user-1", front: "  ", back: "something", explanation: null }),
    ).rejects.toThrow();
  });

  it("creates an active manual flashcard with a schedule ready for review", async () => {
    const { useCase, flashcardRepository, cardScheduleRepository, xpEventRepository } =
      buildUseCase();

    const flashcard = await useCase.execute({
      userId: "user-1",
      front: "How do I say 'bom dia'?",
      back: "Good morning",
      explanation: null,
    });

    expect(flashcard.cardType).toBe("manual");
    expect(flashcard.status).toBe("active");
    expect(flashcardRepository.flashcards).toHaveLength(1);

    const schedule = await cardScheduleRepository.findByFlashcardId(flashcard.id);
    expect(schedule).not.toBeNull();
    expect(schedule?.state).toBe("new");

    expect(xpEventRepository.events).toHaveLength(1);
    expect(xpEventRepository.events[0]).toMatchObject({
      userId: "user-1",
      sourceType: "flashcard_saved",
      sourceId: flashcard.id,
      amount: 2,
    });
  });
});
