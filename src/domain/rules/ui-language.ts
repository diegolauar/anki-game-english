import { DEFAULT_LOCALE, isLocale, type Locale } from "@/domain/value-objects/locale";

export function getUiLanguage(preferences: Record<string, unknown>): Locale {
  const value = preferences["uiLanguage"];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
