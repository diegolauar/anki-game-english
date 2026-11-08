import { describe, expect, it } from "vitest";
import { ApplySubscriptionWebhookEvent } from "@/application/use-cases/apply-subscription-webhook-event";
import type { Subscription } from "@/domain/entities/subscription";
import { FakeSubscriptionWriter } from "./fakes";

function seedSubscription(writer: FakeSubscriptionWriter, overrides: Partial<Subscription> = {}): void {
  writer.subscriptions.push({
    userId: "user-1",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: null,
    status: "incomplete",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}

describe("ApplySubscriptionWebhookEvent", () => {
  it("activates the subscription on subscription_upserted", async () => {
    const writer = new FakeSubscriptionWriter();
    seedSubscription(writer);
    const useCase = new ApplySubscriptionWebhookEvent(writer);

    await useCase.execute({
      id: "evt_1",
      type: "subscription_upserted",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      status: "active",
      currentPeriodEnd: "2026-12-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    });

    const subscription = writer.subscriptions[0];
    expect(subscription.status).toBe("active");
    expect(subscription.stripeSubscriptionId).toBe("sub_1");
    expect(subscription.currentPeriodEnd).toBe("2026-12-01T00:00:00.000Z");
  });

  it("cancels the subscription on subscription_deleted", async () => {
    const writer = new FakeSubscriptionWriter();
    seedSubscription(writer, { status: "active", stripeSubscriptionId: "sub_1" });
    const useCase = new ApplySubscriptionWebhookEvent(writer);

    await useCase.execute({
      id: "evt_2",
      type: "subscription_deleted",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    });

    expect(writer.subscriptions[0].status).toBe("canceled");
  });

  it("does nothing on an ignored event", async () => {
    const writer = new FakeSubscriptionWriter();
    seedSubscription(writer);
    const useCase = new ApplySubscriptionWebhookEvent(writer);

    await useCase.execute({ id: "evt_3", type: "ignored" });

    expect(writer.subscriptions[0].status).toBe("incomplete");
  });
});
