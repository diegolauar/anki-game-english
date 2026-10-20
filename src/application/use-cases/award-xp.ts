import type { XpEvent } from "@/domain/entities/xp-event";
import type { XpEventRepository } from "@/domain/ports/xp-event-repository";
import { XP_REWARDS } from "@/domain/rules/xp-rewards";
import type { XpSourceType } from "@/domain/value-objects/xp-source-type";

export interface AwardXpInput {
  userId: string;
  sourceType: XpSourceType;
  sourceId: string;
}

export class AwardXp {
  constructor(private readonly xpEventRepository: XpEventRepository) {}

  /** Retorna null quando o evento já tinha sido recompensado antes (idempotente). */
  async execute(input: AwardXpInput): Promise<XpEvent | null> {
    return this.xpEventRepository.create({
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      amount: XP_REWARDS[input.sourceType],
    });
  }
}
