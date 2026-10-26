import { getLocale } from "next-intl/server";
import type { Locale } from "@/domain/value-objects/locale";

/**
 * `getLocale()` do next-intl devolve `string` porque a tipagem não conhece o
 * union de locales do app sem configuração global extra — o cast é seguro
 * porque `src/i18n/request.ts` só resolve pra um dos valores de `Locale`.
 */
export async function getTypedLocale(): Promise<Locale> {
  return (await getLocale()) as Locale;
}
