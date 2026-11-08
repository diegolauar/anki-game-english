import { describe, expect, it } from "vitest";
import { StartBillingPortal } from "@/application/use-cases/start-billing-portal";
import type { Subscription } from "@/domain/entities/subscription";
import { FakePaymentProvider, FakeSubscriptionRepository } from "./fakes";

function buildSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    userId: "user-1",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("StartBillingPortal", () => {
  it("opens a portal session for the subscriber's Stripe customer", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.seed(buildSubscription());
    const paymentProvider = new FakePaymentProvider();
    const useCase = new StartBillingPortal(subscriptionRepository, paymentProvider);

    const result = await useCase.execute({
      userId: "user-1",
      returnUrl: "https://app.example.com/dashboard",
    });

    expect(result.portalUrl).toBe("https://billing.stripe.com/fake");
    expect(paymentProvider.portalCalls[0]).toEqual({
      stripeCustomerId: "cus_1",
      returnUrl: "https://app.example.com/dashboard",
    });
  });

  it("throws when the user has no subscription on file", async () => {
    const useCase = new StartBillingPortal(new FakeSubscriptionRepository(), new FakePaymentProvider());

    await expect(
      useCase.execute({ userId: "user-1", returnUrl: "https://app.example.com/dashboard" }),
    ).rejects.toThrow();
  });
});
