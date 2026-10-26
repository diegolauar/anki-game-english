export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "active",
  "past_due",
  "canceled",
  "unpaid",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Único status que libera acesso ao produto (plano único, sem trial). */
export function hasActiveAccess(status: SubscriptionStatus): boolean {
  return status === "active";
}
