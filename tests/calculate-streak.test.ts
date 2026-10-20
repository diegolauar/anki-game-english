import { describe, expect, it } from "vitest";
import { calculateStreak } from "@/domain/rules/calculate-streak";

function daysBefore(today: Date, days: number): string {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

describe("calculateStreak", () => {
  it("returns 0 when there is no activity at all", () => {
    const today = new Date("2026-01-10T12:00:00.000Z");
    expect(calculateStreak([], today)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const today = new Date("2026-01-10T12:00:00.000Z");
    const dates = [daysBefore(today, 0), daysBefore(today, 1), daysBefore(today, 2)];

    expect(calculateStreak(dates, today)).toBe(3);
  });

  it("still counts the streak through yesterday when today has no activity yet", () => {
    const today = new Date("2026-01-10T08:00:00.000Z");
    const dates = [daysBefore(today, 1), daysBefore(today, 2), daysBefore(today, 3)];

    expect(calculateStreak(dates, today)).toBe(3);
  });

  it("stops counting at the first gap", () => {
    const today = new Date("2026-01-10T12:00:00.000Z");
    const dates = [daysBefore(today, 0), daysBefore(today, 1), daysBefore(today, 3)];

    expect(calculateStreak(dates, today)).toBe(2);
  });

  it("resets to 0 when the last activity was more than one day ago", () => {
    const today = new Date("2026-01-10T12:00:00.000Z");
    const dates = [daysBefore(today, 5), daysBefore(today, 6)];

    expect(calculateStreak(dates, today)).toBe(0);
  });

  it("ignores unordered input", () => {
    const today = new Date("2026-01-10T12:00:00.000Z");
    const dates = [daysBefore(today, 2), daysBefore(today, 0), daysBefore(today, 1)];

    expect(calculateStreak(dates, today)).toBe(3);
  });
});
