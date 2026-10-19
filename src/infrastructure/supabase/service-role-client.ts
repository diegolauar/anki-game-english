import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";

/**
 * Usa a service_role key — ignora RLS. Nunca importar fora de código de servidor
 * (rotas de API, casos de uso), e nunca expor ao cliente.
 */
export function createSupabaseServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
