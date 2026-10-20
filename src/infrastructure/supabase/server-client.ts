import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/infrastructure/supabase/database.types";
import type { SessionSupabaseClient } from "@/infrastructure/supabase/client-types";

export async function createSupabaseServerClient(): Promise<SessionSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita;
            // ignorado porque o middleware cuida da renovação da sessão.
          }
        },
      },
    },
  ) as SessionSupabaseClient;
}
