import { describe, expect, it } from "vitest";
import { AwardXp } from "@/application/use-cases/award-xp";
import { FakeXpEventRepository } from "./fakes";

describe("AwardXp", () => {
  it("creates an xp_event with the amount for the given source type", async () => {
    const repository = new FakeXpEventRepository();
    const useCase = new AwardXp(repository);

    const event = await useCase.execute({
      userId: "user-1",
      sourceType: "flashcard_saved",
      sourceId: "flashcard-1",
    });

    expect(event).toMatchObject({
      userId: "user-1",
      sourceType: "flashcard_saved",
      sourceId: "flashcard-1",
      amount: 2,
    });
  });

  it("never pays the same source twice (idempotent by source_id)", async () => {
    const repository = new FakeXpEventRepository();
    const useCase = new AwardXp(repository);

    const first = await useCase.execute({
      userId: "user-1",
      sourceType: "conversation_finished",
      sourceId: "conversation-1",
    });
    const second = await useCase.execute({
      userId: "user-1",
      sourceType: "conversation_finished",
      sourceId: "conversation-1",
    });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(repository.events).toHaveLength(1);
  });

  it("awards the correct amount for every source type", async () => {
    const repository = new FakeXpEventRepository();
    const useCase = new AwardXp(repository);

    const conversation = await useCase.execute({
      userId: "user-1",
      sourceType: "conversation_finished",
      sourceId: "a",
    });
    const flashcardSaved = await useCase.execute({
      userId: "user-1",
      sourceType: "flashcard_saved",
      sourceId: "b",
    });
    const flashcardReviewed = await useCase.execute({
      userId: "user-1",
      sourceType: "flashcard_reviewed",
      sourceId: "c",
    });
    const dailyBonus = await useCase.execute({
      userId: "user-1",
      sourceType: "daily_reviews_completed",
      sourceId: "d",
    });

    expect(conversation?.amount).toBe(20);
    expect(flashcardSaved?.amount).toBe(2);
    expect(flashcardReviewed?.amount).toBe(1);
    expect(dailyBonus?.amount).toBe(10);
  });
});
