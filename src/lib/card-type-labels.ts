import type { useTranslations } from "next-intl";
import type { CardType } from "@/domain/value-objects/card-type";

type Translator = ReturnType<typeof useTranslations>;

export function buildCardTypeLabels(t: Translator): Record<CardType, string> {
  return {
    production: t("productionLabel"),
    cloze: t("clozeLabel"),
    manual: t("manualLabel"),
  };
}
