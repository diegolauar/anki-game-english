import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import type { SessionSupabaseClient } from "@/infrastructure/supabase/client-types";

export async function requireUser(): Promise<{
  supabase: SessionSupabaseClient;
  user: User;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
