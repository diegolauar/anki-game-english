import type { PaymentProvider } from "@/domain/ports/payment-provider";
import type { SubscriptionRepository } from "@/domain/ports/subscription-repository";

export interface StartBillingPortalInput {
  userId: string;
  returnUrl: string;
}

export interface StartBillingPortalResult {
  portalUrl: string;
}

export class StartBillingPortal {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(input: StartBillingPortalInput): Promise<StartBillingPortalResult> {
    const subscription = await this.subscriptionRepository.getByUserId(input.userId);
    if (!subscription) throw new Error("User has no subscription on file.");

    const result = await this.paymentProvider.createBillingPortalSession({
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: input.returnUrl,
    });

    return { portalUrl: result.portalUrl };
  }
}
