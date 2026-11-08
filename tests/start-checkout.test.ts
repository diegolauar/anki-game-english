import { describe, expect, it } from "vitest";
import { StartCheckout } from "@/application/use-cases/start-checkout";
import type { Subscription } from "@/domain/entities/subscription";
import { FakePaymentProvider, FakeSubscriptionRepository, FakeSubscriptionWriter } from "./fakes";

function buildSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    userId: "user-1",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    status: "incomplete",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("StartCheckout", () => {
  it("creates a Stripe customer and a pending row for a first-time subscriber", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    const subscriptionWriter = new FakeSubscriptionWriter();
    const paymentProvider = new FakePaymentProvider();
    const useCase = new StartCheckout(subscriptionRepository, subscriptionWriter, paymentProvider);

    const result = await useCase.execute({
      userId: "user-1",
      userEmail: "user@example.com",
      successUrl: "https://app.example.com/dashboard?checkout=success",
      cancelUrl: "https://app.example.com/dashboard?checkout=canceled",
    });

    expect(result.checkoutUrl).toBe(paymentProvider.nextCheckoutSession.checkoutUrl);
    expect(paymentProvider.checkoutCalls[0].stripeCustomerId).toBeNull();
    expect(subscriptionWriter.createPendingCalls).toHaveLength(1);
    expect(subscriptionWriter.createPendingCalls[0].stripeCustomerId).toBe(
      paymentProvider.nextCheckoutSession.stripeCustomerId,
    );
  });

  it("reuses the existing Stripe customer id and does not create another pending row", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.seed(buildSubscription({ status: "canceled" }));
    const subscriptionWriter = new FakeSubscriptionWriter();
    const paymentProvider = new FakePaymentProvider();
    const useCase = new StartCheckout(subscriptionRepository, subscriptionWriter, paymentProvider);

    await useCase.execute({
      userId: "user-1",
      userEmail: "user@example.com",
      successUrl: "https://app.example.com/dashboard?checkout=success",
      cancelUrl: "https://app.example.com/dashboard?checkout=canceled",
    });

    expect(paymentProvider.checkoutCalls[0].stripeCustomerId).toBe("cus_1");
    expect(subscriptionWriter.createPendingCalls).toHaveLength(0);
  });

  it("throws when the user already has an active subscription", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.seed(buildSubscription({ status: "active" }));
    const useCase = new StartCheckout(
      subscriptionRepository,
      new FakeSubscriptionWriter(),
      new FakePaymentProvider(),
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        userEmail: "user@example.com",
        successUrl: "https://app.example.com/dashboard?checkout=success",
        cancelUrl: "https://app.example.com/dashboard?checkout=canceled",
      }),
    ).rejects.toThrow();
  });
});
