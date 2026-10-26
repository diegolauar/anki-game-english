import type { SubscriptionStatus } from "@/domain/value-objects/subscription-status";

export interface CreateCheckoutSessionInput {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResult {
  checkoutUrl: string;
  stripeCustomerId: string;
}

export interface CreateBillingPortalSessionInput {
  stripeCustomerId: string;
  returnUrl: string;
}

export interface CreateBillingPortalSessionResult {
  portalUrl: string;
}

interface SubscriptionWebhookEventBase {
  /** Event id do Stripe (evt_...); usado para deduplicar reentregas. */
  id: string;
}

export type SubscriptionWebhookEvent =
  | (SubscriptionWebhookEventBase & {
      type: "subscription_upserted";
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      status: SubscriptionStatus;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    })
  | (SubscriptionWebhookEventBase & {
      type: "subscription_deleted";
      stripeCustomerId: string;
      stripeSubscriptionId: string;
    })
  | (SubscriptionWebhookEventBase & { type: "ignored" });

/** Isola o Stripe do resto do app; trocar de fornecedor de pagamento = novo adaptador. */
export interface PaymentProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult>;
  createBillingPortalSession(
    input: CreateBillingPortalSessionInput,
  ): Promise<CreateBillingPortalSessionResult>;
  /**
   * Valida a assinatura HMAC do payload bruto contra `STRIPE_WEBHOOK_SECRET` e
   * traduz o evento do Stripe para o vocabulário do domínio. Lança se a
   * assinatura for inválida — a rota deve responder 400 e não processar.
   */
  parseWebhookEvent(rawBody: string, signatureHeader: string): SubscriptionWebhookEvent;
}
