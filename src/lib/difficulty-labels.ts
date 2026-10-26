import type { useTranslations } from "next-intl";
import type { Difficulty } from "@/domain/value-objects/difficulty";

type Translator = ReturnType<typeof useTranslations>;

export function buildDifficultyLabels(t: Translator): Record<Difficulty, string> {
  return {
    beginner: t("beginnerLabel"),
    intermediate: t("intermediateLabel"),
    advanced: t("advancedLabel"),
  };
}

export function buildDifficultyDescriptions(t: Translator): Record<Difficulty, string> {
  return {
    beginner: t("beginnerDescription"),
    intermediate: t("intermediateDescription"),
    advanced: t("advancedDescription"),
  };
}
