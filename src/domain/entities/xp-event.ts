import type { XpSourceType } from "@/domain/value-objects/xp-source-type";

export interface XpEvent {
  id: string;
  userId: string;
  sourceType: XpSourceType;
  sourceId: string;
  amount: number;
  createdAt: string;
}
