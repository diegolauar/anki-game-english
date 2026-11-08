import type { SubscriptionWebhookEvent } from "@/domain/ports/payment-provider";
import type { SubscriptionWriter } from "@/domain/ports/subscription-writer";

/** Traduz um evento de webhook do Stripe (já validado e normalizado) em uma atualização de `subscriptions`. */
export class ApplySubscriptionWebhookEvent {
  constructor(private readonly subscriptionWriter: SubscriptionWriter) {}

  async execute(event: SubscriptionWebhookEvent): Promise<void> {
    if (event.type === "subscription_upserted") {
      await this.subscriptionWriter.updateByStripeCustomerId({
        stripeCustomerId: event.stripeCustomerId,
        stripeSubscriptionId: event.stripeSubscriptionId,
        status: event.status,
        currentPeriodEnd: event.currentPeriodEnd,
        cancelAtPeriodEnd: event.cancelAtPeriodEnd,
      });
      return;
    }

    if (event.type === "subscription_deleted") {
      await this.subscriptionWriter.updateByStripeCustomerId({
        stripeCustomerId: event.stripeCustomerId,
        stripeSubscriptionId: event.stripeSubscriptionId,
        status: "canceled",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
      return;
    }
  }
}
