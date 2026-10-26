import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/domain/value-objects/locale";
import { LOCALE_COOKIE_NAME } from "@/i18n/locale-cookie";

/** Parse manual do Accept-Language — poucos valores, não justifica uma dependência nova. */
function negotiateFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => Boolean(tag));

  for (const tag of preferred) {
    const match = LOCALES.find(
      (locale) => locale.toLowerCase() === tag || locale.toLowerCase().startsWith(tag.split("-")[0]),
    );
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateFromAcceptLanguage((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
