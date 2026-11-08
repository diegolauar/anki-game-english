import type Stripe from "stripe";
import { createStripeClient } from "@/infrastructure/stripe/stripe-client";
import type {
  CreateBillingPortalSessionInput,
  CreateBillingPortalSessionResult,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentProvider,
  SubscriptionWebhookEvent,
} from "@/domain/ports/payment-provider";
import type { SubscriptionStatus } from "@/domain/value-objects/subscription-status";

/** Plano único, sem trial (seção 8 do CLAUDE.md) — `trialing` nunca deveria ocorrer, mas se ocorrer libera acesso. */
function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "incomplete";
  }
}

function toCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

/** `current_period_end` vive no item da assinatura (não mais no objeto raiz) desde a mudança de API para multi-item. */
function subscriptionCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000).toISOString() : null;
}

/** Isola o Stripe do resto do app (ver `domain/ports/payment-provider.ts`). */
export class StripePaymentProvider implements PaymentProvider {
  private readonly client: Stripe;
  private readonly priceId: string;

  constructor() {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRICE_ID is not set.");

    this.client = createStripeClient();
    this.priceId = priceId;
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
    const stripeCustomerId =
      input.stripeCustomerId ??
      (
        await this.client.customers.create({
          email: input.userEmail,
          metadata: { userId: input.userId },
        })
      ).id;

    const session = await this.client.checkout.sessions.create({
      ui_mode: "hosted_page",
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: input.userId,
      line_items: [{ price: this.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      payment_method_collection: "always",
      submit_type: "auto",
      integration_identifier: "hosted_web_0001",
      origin_context: "web",
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    return { checkoutUrl: session.url, stripeCustomerId };
  }

  async createBillingPortalSession(
    input: CreateBillingPortalSessionInput,
  ): Promise<CreateBillingPortalSessionResult> {
    const session = await this.client.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: input.returnUrl,
    });
    return { portalUrl: session.url };
  }

  parseWebhookEvent(rawBody: string, signatureHeader: string): SubscriptionWebhookEvent {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");

    const event = this.client.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      return {
        id: event.id,
        type: "subscription_upserted",
        stripeCustomerId: toCustomerId(subscription.customer),
        stripeSubscriptionId: subscription.id,
        status: mapSubscriptionStatus(subscription.status),
        currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription) ?? new Date().toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      return {
        id: event.id,
        type: "subscription_deleted",
        stripeCustomerId: toCustomerId(subscription.customer),
        stripeSubscriptionId: subscription.id,
      };
    }

    return { id: event.id, type: "ignored" };
  }
}
