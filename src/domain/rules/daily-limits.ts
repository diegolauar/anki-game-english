export const DEFAULT_DAILY_MESSAGE_LIMIT = 50;
export const DEFAULT_DAILY_VOICE_MINUTES_LIMIT = 15;

function readPositiveNumber(
  preferences: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = preferences[key];
  return typeof value === "number" && value > 0 ? value : fallback;
}

export function getDailyMessageLimit(preferences: Record<string, unknown>): number {
  return readPositiveNumber(preferences, "dailyMessageLimit", DEFAULT_DAILY_MESSAGE_LIMIT);
}

export function getDailyVoiceMinutesLimit(preferences: Record<string, unknown>): number {
  return readPositiveNumber(
    preferences,
    "dailyVoiceMinutesLimit",
    DEFAULT_DAILY_VOICE_MINUTES_LIMIT,
  );
}
