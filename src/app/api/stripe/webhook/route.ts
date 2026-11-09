import { NextResponse } from "next/server";
import { StripePaymentProvider } from "@/infrastructure/stripe/stripe-payment-provider";
import { ApplySubscriptionWebhookEvent } from "@/application/use-cases/apply-subscription-webhook-event";
import { SupabaseSubscriptionWriter } from "@/infrastructure/supabase/subscription-writer";
import { SupabaseStripeWebhookEventLog } from "@/infrastructure/supabase/stripe-webhook-event-log";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = new StripePaymentProvider().parseWebhookEvent(rawBody, signature);
  } catch (error) {
    logError("stripe_webhook_invalid_signature", {}, error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();

  try {
    await new ApplySubscriptionWebhookEvent(new SupabaseSubscriptionWriter(serviceRoleClient)).execute(event);
  } catch (error) {
    logError("stripe_webhook_apply_failed", { eventId: event.id, eventType: event.type }, error);
    return NextResponse.json({ error: "Failed to apply event." }, { status: 500 });
  }

  // Registrado só depois de aplicar com sucesso: se a primeira tentativa falhar,
  // o evento não fica marcado como "visto" e o reenvio automático do Stripe
  // ainda consegue reaplicá-lo. Reaplicar um evento já bem-sucedido é inofensivo
  // (updateByStripeCustomerId sobrescreve com os mesmos dados do evento), e
  // recordIfNew já trata a violação de unicidade sem lançar erro.
  await new SupabaseStripeWebhookEventLog(serviceRoleClient).recordIfNew(event.id, event.type);

  return NextResponse.json({ received: true });
}
