"use server";

import { cookies } from "next/headers";
import { SetUiLanguage } from "@/application/use-cases/set-ui-language";
import { isLocale, type Locale } from "@/domain/value-objects/locale";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseUserProfileWriter } from "@/infrastructure/supabase/user-profile-writer";
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from "@/i18n/locale-cookie";

export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await new SetUiLanguage(new SupabaseUserProfileWriter(supabase)).execute(user.id, locale);
}
