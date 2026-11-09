export interface DailyUsage {
  messageCount: number;
  voiceMinutes: number;
  conversationsFinished: number;
}

export interface DailyUsageRepository {
  getTodayUsage(userId: string): Promise<DailyUsage>;
}
