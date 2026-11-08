import type { Subscription } from "@/domain/entities/subscription";
import type {
  CreatePendingSubscriptionInput,
  SubscriptionWriter,
  UpdateSubscriptionByStripeCustomerInput,
} from "@/domain/ports/subscription-writer";
import type { SubscriptionStatus } from "@/domain/value-objects/subscription-status";
import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";
import type { Database } from "@/infrastructure/supabase/database.types";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status as SubscriptionStatus,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    updatedAt: row.updated_at,
  };
}

/** Escreve em `subscriptions`, que só tem policy de RLS para SELECT — exige a service_role. */
export class SupabaseSubscriptionWriter implements SubscriptionWriter {
  constructor(private readonly client: ServiceRoleSupabaseClient) {}

  async createPending(input: CreatePendingSubscriptionInput): Promise<void> {
    const { error } = await this.client
      .from("subscriptions")
      .upsert(
        { user_id: input.userId, stripe_customer_id: input.stripeCustomerId },
        { onConflict: "user_id", ignoreDuplicates: true },
      );

    if (error) throw error;
  }

  async updateByStripeCustomerId(input: UpdateSubscriptionByStripeCustomerInput): Promise<Subscription> {
    const { data, error } = await this.client
      .from("subscriptions")
      .update({
        stripe_subscription_id: input.stripeSubscriptionId,
        status: input.status,
        current_period_end: input.currentPeriodEnd,
        cancel_at_period_end: input.cancelAtPeriodEnd,
      })
      .eq("stripe_customer_id", input.stripeCustomerId)
      .select()
      .single();

    if (error) throw error;
    return toSubscription(data);
  }
}
