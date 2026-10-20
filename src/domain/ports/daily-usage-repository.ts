export interface DailyUsage {
  messageCount: number;
  voiceMinutes: number;
}

export interface DailyUsageRepository {
  getTodayUsage(userId: string): Promise<DailyUsage>;
}
