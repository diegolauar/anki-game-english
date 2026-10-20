import { describe, expect, it } from "vitest";
import { TsFsrsReviewScheduler } from "@/infrastructure/scheduler/ts-fsrs-review-scheduler";
import { CARD_STATES } from "@/domain/value-objects/card-state";

describe("TsFsrsReviewScheduler", () => {
  it("creates a brand new card due immediately", () => {
    const scheduler = new TsFsrsReviewScheduler();
    const now = new Date("2026-01-01T10:00:00.000Z");

    const initial = scheduler.initialState(now);

    expect(initial.state).toBe("new");
    expect(initial.reps).toBe(0);
    expect(initial.lapses).toBe(0);
    expect(new Date(initial.dueAt).getTime()).toBe(now.getTime());
  });

  it("schedules the card into the future after a 'good' review and moves it to review state", () => {
    const scheduler = new TsFsrsReviewScheduler();
    const now = new Date("2026-01-01T10:00:00.000Z");
    const initial = scheduler.initialState(now);

    const outcome = scheduler.review(initial, "good", now);

    expect(CARD_STATES).toContain(outcome.schedule.state);
    expect(outcome.schedule.state).toBe("review");
    expect(outcome.schedule.reps).toBe(1);
    expect(new Date(outcome.schedule.dueAt).getTime()).toBeGreaterThan(now.getTime());
    expect(outcome.schedule.lastReviewedAt).toBe(now.toISOString());
  });

  it("increments lapses and still schedules a future review after an 'again' rating on a reviewed card", () => {
    const scheduler = new TsFsrsReviewScheduler();
    const firstReview = new Date("2026-01-01T10:00:00.000Z");
    const secondReview = new Date("2026-01-05T10:00:00.000Z");

    const initial = scheduler.initialState(firstReview);
    const afterFirstReview = scheduler.review(initial, "good", firstReview).schedule;

    const afterSecondReview = scheduler.review(afterFirstReview, "again", secondReview);

    expect(afterSecondReview.schedule.lapses).toBe(1);
    expect(afterSecondReview.schedule.state).toBe("review");
    expect(afterSecondReview.elapsedDays).toBeGreaterThanOrEqual(0);
  });

  it("round-trips every card state through a review without throwing", () => {
    const scheduler = new TsFsrsReviewScheduler();
    const now = new Date("2026-01-01T10:00:00.000Z");

    for (const state of CARD_STATES) {
      const snapshot = {
        dueAt: now.toISOString(),
        stability: 1,
        difficulty: 1,
        reps: 1,
        lapses: 0,
        state,
        lastReviewedAt: now.toISOString(),
      };

      expect(() => scheduler.review(snapshot, "easy", now)).not.toThrow();
    }
  });
});
