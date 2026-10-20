export interface DailyXpTotal {
  dateKey: string;
  amount: number;
}

/** Somente leitura — `xp_events` só tem policy de RLS para SELECT do próprio usuário. */
export interface XpEventRepository {
  sumByUser(userId: string): Promise<number>;
  listActiveDateKeysByUser(userId: string): Promise<string[]>;
  listDailyTotalsByUser(userId: string, since: Date): Promise<DailyXpTotal[]>;
}
