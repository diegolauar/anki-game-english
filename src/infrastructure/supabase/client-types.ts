import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";

declare const SESSION_BRAND: unique symbol;
declare const SERVICE_ROLE_BRAND: unique symbol;

/**
 * Cliente autenticado como o usuário da sessão — respeita RLS. É o que
 * `createSupabaseServerClient` e `createSupabaseBrowserClient` retornam.
 */
export type SessionSupabaseClient = SupabaseClient<Database> & {
  readonly [SESSION_BRAND]: "session";
};

/**
 * Cliente com a `service_role` key — ignora RLS. Só `createSupabaseServiceRoleClient`
 * produz este tipo; os escritores privilegiados (`*Writer`) em `analyses`, `findings`,
 * `learning_points` e `xp_events` só aceitam este tipo no construtor, então passar o
 * cliente de sessão onde a service role é exigida vira erro de compilação, não um erro
 * de RLS em produção (ver `PROJECT_STATUS.md` / commit "fix: service_role para escritas...").
 */
export type ServiceRoleSupabaseClient = SupabaseClient<Database> & {
  readonly [SERVICE_ROLE_BRAND]: "service-role";
};
