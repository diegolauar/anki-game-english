import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function requireRlsTestEnv(): void {
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    throw new Error(
      "tests/rls precisa de NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e " +
        "SUPABASE_SERVICE_ROLE_KEY (rode via `npm run test:rls`, com o Supabase local no ar).",
    );
  }
}

export function createServiceRoleTestClient(): SupabaseClient<Database> {
  requireRlsTestEnv();
  return createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createAnonTestClient(): SupabaseClient<Database> {
  requireRlsTestEnv();
  return createClient<Database>(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface RlsTestUser {
  id: string;
  email: string;
  /** Cliente autenticado como este usuário — respeita RLS (role authenticated). */
  client: SupabaseClient<Database>;
}

/**
 * Cria (ou reaproveita, se já existir de uma run anterior) um usuário de teste
 * confirmado por e-mail e retorna um cliente autenticado como ele via
 * signInWithPassword — sem precisar do fluxo de magic link (ver e2e/helpers.ts
 * para o motivo de não reaproveitar aquele helper aqui: estes testes precisam
 * rodar sem navegador).
 */
export async function ensureRlsTestUser(email: string, password: string): Promise<RlsTestUser> {
  const admin = createServiceRoleTestClient();

  const { data: existing, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  let user = existing.users.find((candidate) => candidate.email === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, { password });
    if (error) throw error;
  }

  const anon = createAnonTestClient();
  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const client = createClient<Database>(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${signInData.session!.access_token}` },
    },
  });

  return { id: user.id, email, client };
}
