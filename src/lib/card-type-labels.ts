import type { CardType } from "@/domain/value-objects/card-type";

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  production: "Produção",
  cloze: "Lacuna",
  manual: "Manual",
};
