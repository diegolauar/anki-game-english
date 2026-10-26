import type { SubscriptionStatus } from "@/domain/value-objects/subscription-status";

export interface Subscription {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
}
