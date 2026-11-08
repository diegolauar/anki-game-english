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
  const isNewEvent = await new SupabaseStripeWebhookEventLog(serviceRoleClient).recordIfNew(
    event.id,
    event.type,
  );
  if (!isNewEvent) {
    return NextResponse.json({ received: true });
  }

  try {
    await new ApplySubscriptionWebhookEvent(new SupabaseSubscriptionWriter(serviceRoleClient)).execute(event);
  } catch (error) {
    logError("stripe_webhook_apply_failed", { eventId: event.id, eventType: event.type }, error);
    return NextResponse.json({ error: "Failed to apply event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
