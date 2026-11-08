"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/infrastructure/supabase/require-user";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { StartCheckout } from "@/application/use-cases/start-checkout";
import { StartBillingPortal } from "@/application/use-cases/start-billing-portal";
import { SupabaseSubscriptionRepository } from "@/infrastructure/supabase/subscription-repository";
import { SupabaseSubscriptionWriter } from "@/infrastructure/supabase/subscription-writer";
import { StripePaymentProvider } from "@/infrastructure/stripe/stripe-payment-provider";

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function startCheckoutAction(): Promise<void> {
  const { supabase, user } = await requireUser();
  if (!user.email) throw new Error("User has no email on file.");

  const origin = await getOrigin();

  const useCase = new StartCheckout(
    new SupabaseSubscriptionRepository(supabase),
    new SupabaseSubscriptionWriter(createSupabaseServiceRoleClient()),
    new StripePaymentProvider(),
  );

  const { checkoutUrl } = await useCase.execute({
    userId: user.id,
    userEmail: user.email,
    successUrl: `${origin}/dashboard?checkout=success`,
    cancelUrl: `${origin}/dashboard?checkout=canceled`,
  });

  redirect(checkoutUrl);
}

export async function manageBillingAction(): Promise<void> {
  const { supabase, user } = await requireUser();

  const origin = await getOrigin();

  const useCase = new StartBillingPortal(
    new SupabaseSubscriptionRepository(supabase),
    new StripePaymentProvider(),
  );

  const { portalUrl } = await useCase.execute({
    userId: user.id,
    returnUrl: `${origin}/dashboard`,
  });

  redirect(portalUrl);
}
