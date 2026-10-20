import type { XpEvent } from "@/domain/entities/xp-event";
import type { XpSourceType } from "@/domain/value-objects/xp-source-type";

export interface CreateXpEventInput {
  userId: string;
  sourceType: XpSourceType;
  sourceId: string;
  amount: number;
}

/**
 * Escrita privilegiada — `xp_events` só tem policy de RLS para SELECT, então os
 * adaptadores de infraestrutura que implementam esta porta exigem a service_role
 * (ver `ServiceRoleSupabaseClient`).
 */
export interface XpEventWriter {
  /** Retorna null (sem lançar) quando o evento já existe — a recompensa nunca paga duas vezes. */
  create(input: CreateXpEventInput): Promise<XpEvent | null>;
}
