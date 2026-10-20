import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/infrastructure/supabase/database.types";
import type { SessionSupabaseClient } from "@/infrastructure/supabase/client-types";

export function createSupabaseBrowserClient(): SessionSupabaseClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as SessionSupabaseClient;
}
