import { describe, expect, it } from "vitest";
import { ReviewFlashcard } from "@/application/use-cases/review-flashcard";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { ScheduleSnapshot } from "@/domain/entities/card-schedule";
import {
  FakeCardScheduleRepository,
  FakeFlashcardRepository,
  FakeReviewLogRepository,
  FakeReviewScheduler,
} from "./fakes";

function buildActiveFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
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

function buildSchedule(overrides: Partial<ScheduleSnapshot> = {}): ScheduleSnapshot {
  return {
    dueAt: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: "new",
    lastReviewedAt: null,
    ...overrides,
  };
}

function buildUseCase() {
  const flashcardRepository = new FakeFlashcardRepository();
  const cardScheduleRepository = new FakeCardScheduleRepository();
  const reviewLogRepository = new FakeReviewLogRepository();
  const reviewScheduler = new FakeReviewScheduler();
  const useCase = new ReviewFlashcard(
    flashcardRepository,
    cardScheduleRepository,
    reviewLogRepository,
    reviewScheduler,
  );
  return { useCase, flashcardRepository, cardScheduleRepository, reviewLogRepository, reviewScheduler };
}

describe("ReviewFlashcard", () => {
  it("throws when the flashcard belongs to another user", async () => {
    const { useCase, flashcardRepository, cardScheduleRepository } = buildUseCase();
    flashcardRepository.seed(buildActiveFlashcard());
    await cardScheduleRepository.create("flashcard-1", buildSchedule());

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "someone-else", rating: "good" }),
    ).rejects.toThrow();
  });

  it("throws when the flashcard is not active", async () => {
    const { useCase, flashcardRepository } = buildUseCase();
    flashcardRepository.seed(buildActiveFlashcard({ status: "suspended" }));

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "user-1", rating: "good" }),
    ).rejects.toThrow();
  });

  it("throws when the flashcard has no schedule yet", async () => {
    const { useCase, flashcardRepository } = buildUseCase();
    flashcardRepository.seed(buildActiveFlashcard());

    await expect(
      useCase.execute({ flashcardId: "flashcard-1", userId: "user-1", rating: "good" }),
    ).rejects.toThrow();
  });

  it("updates the schedule and records a review log without exposing the answer beforehand", async () => {
    const { useCase, flashcardRepository, cardScheduleRepository, reviewLogRepository } =
      buildUseCase();
    flashcardRepository.seed(buildActiveFlashcard());
    await cardScheduleRepository.create("flashcard-1", buildSchedule());

    const result = await useCase.execute({
      flashcardId: "flashcard-1",
      userId: "user-1",
      rating: "good",
    });

    expect(result.state).toBe("review");
    expect(result.reps).toBe(1);

    const schedule = await cardScheduleRepository.findByFlashcardId("flashcard-1");
    expect(schedule).toEqual({ ...result, flashcardId: "flashcard-1" });

    expect(reviewLogRepository.logs).toHaveLength(1);
    expect(reviewLogRepository.logs[0]).toMatchObject({
      flashcardId: "flashcard-1",
      userId: "user-1",
      rating: "good",
      stateBefore: "new",
    });
  });

  it("increments lapses on an 'again' rating", async () => {
    const { useCase, flashcardRepository, cardScheduleRepository } = buildUseCase();
    flashcardRepository.seed(buildActiveFlashcard());
    await cardScheduleRepository.create("flashcard-1", buildSchedule({ lapses: 1 }));

    const result = await useCase.execute({
      flashcardId: "flashcard-1",
      userId: "user-1",
      rating: "again",
    });

    expect(result.lapses).toBe(2);
  });
});
