import type { Subscription } from "@/domain/entities/subscription";
import type { SubscriptionStatus } from "@/domain/value-objects/subscription-status";

export interface CreatePendingSubscriptionInput {
  userId: string;
  stripeCustomerId: string;
}

export interface UpdateSubscriptionByStripeCustomerInput {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Escrita privilegiada — `subscriptions` só tem policy de RLS para SELECT, então os
 * adaptadores que implementam esta porta exigem a service_role (ver `ServiceRoleSupabaseClient`).
 */
export interface SubscriptionWriter {
  /**
   * Garante a linha antes do checkout, com status 'incomplete', para que o
   * webhook consiga localizar o usuário pelo stripeCustomerId quando o
   * Stripe confirmar o pagamento. Idempotente: não falha se a linha já existir.
   */
  createPending(input: CreatePendingSubscriptionInput): Promise<void>;

  /** Aplica o estado reportado por um evento de webhook do Stripe. */
  updateByStripeCustomerId(input: UpdateSubscriptionByStripeCustomerInput): Promise<Subscription>;
}
