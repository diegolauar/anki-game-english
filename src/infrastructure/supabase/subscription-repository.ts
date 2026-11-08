import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subscription } from "@/domain/entities/subscription";
import type { SubscriptionRepository } from "@/domain/ports/subscription-repository";
import type { SubscriptionStatus } from "@/domain/value-objects/subscription-status";
import type { Database } from "@/infrastructure/supabase/database.types";

const SUBSCRIPTION_COLUMNS =
  "user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end, updated_at";

type SubscriptionRow = Pick<
  Database["public"]["Tables"]["subscriptions"]["Row"],
  | "user_id"
  | "stripe_customer_id"
  | "stripe_subscription_id"
  | "status"
  | "current_period_end"
  | "cancel_at_period_end"
  | "updated_at"
>;

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

/** Somente leitura — `subscriptions` só tem policy de RLS para SELECT do próprio usuário. */
export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getByUserId(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.client
      .from("subscriptions")
      .select(SUBSCRIPTION_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? toSubscription(data) : null;
  }
}
