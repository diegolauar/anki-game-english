import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";

const UNIQUE_VIOLATION = "23505";

/** Deduplica reentregas de webhook do Stripe (tabela `stripe_webhook_events`, append-only). */
export class SupabaseStripeWebhookEventLog {
  constructor(private readonly client: ServiceRoleSupabaseClient) {}

  /** Registra o evento e retorna `true` se era inédito; `false` se já tinha sido processado. */
  async recordIfNew(eventId: string, type: string): Promise<boolean> {
    const { error } = await this.client.from("stripe_webhook_events").insert({ id: eventId, type });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) return false;
      throw error;
    }
    return true;
  }
}
