import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { hasActiveAccess } from "@/domain/value-objects/subscription-status";
import { requireUser } from "@/infrastructure/supabase/require-user";
import { SupabaseSubscriptionRepository } from "@/infrastructure/supabase/subscription-repository";
import type { SessionSupabaseClient } from "@/infrastructure/supabase/client-types";

/** Usado pelas telas e ações que exigem assinatura ativa (seção 10, Fase 7, do CLAUDE.md). */
export async function requireActiveSubscription(): Promise<{
  supabase: SessionSupabaseClient;
  user: User;
}> {
  const { supabase, user } = await requireUser();

  const subscription = await new SupabaseSubscriptionRepository(supabase).getByUserId(user.id);
  if (!subscription || !hasActiveAccess(subscription.status)) redirect("/dashboard?subscribe=required");

  return { supabase, user };
}
