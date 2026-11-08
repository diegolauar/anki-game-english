import type { PaymentProvider } from "@/domain/ports/payment-provider";
import type { SubscriptionRepository } from "@/domain/ports/subscription-repository";
import type { SubscriptionWriter } from "@/domain/ports/subscription-writer";
import { hasActiveAccess } from "@/domain/value-objects/subscription-status";

export interface StartCheckoutInput {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StartCheckoutResult {
  checkoutUrl: string;
}

export class StartCheckout {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionWriter: SubscriptionWriter,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(input: StartCheckoutInput): Promise<StartCheckoutResult> {
    const existing = await this.subscriptionRepository.getByUserId(input.userId);
    if (existing && hasActiveAccess(existing.status)) {
      throw new Error("User already has an active subscription.");
    }

    const result = await this.paymentProvider.createCheckoutSession({
      userId: input.userId,
      userEmail: input.userEmail,
      stripeCustomerId: existing?.stripeCustomerId ?? null,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    if (!existing) {
      await this.subscriptionWriter.createPending({
        userId: input.userId,
        stripeCustomerId: result.stripeCustomerId,
      });
    }

    return { checkoutUrl: result.checkoutUrl };
  }
}
