import type { XpEvent } from "@/domain/entities/xp-event";
import type { XpSourceType } from "@/domain/value-objects/xp-source-type";

export interface CreateXpEventInput {
  userId: string;
  sourceType: XpSourceType;
  sourceId: string;
  amount: number;
}

export interface DailyXpTotal {
  dateKey: string;
  amount: number;
}

export interface XpEventRepository {
  /** Retorna null (sem lançar) quando o evento já existe — a recompensa nunca paga duas vezes. */
  create(input: CreateXpEventInput): Promise<XpEvent | null>;
  sumByUser(userId: string): Promise<number>;
  listActiveDateKeysByUser(userId: string): Promise<string[]>;
  listDailyTotalsByUser(userId: string, since: Date): Promise<DailyXpTotal[]>;
}
