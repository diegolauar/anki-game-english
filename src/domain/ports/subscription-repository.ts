import type { Subscription } from "@/domain/entities/subscription";

/** Somente leitura — `subscriptions` só tem policy de RLS para SELECT do próprio usuário. */
export interface SubscriptionRepository {
  getByUserId(userId: string): Promise<Subscription | null>;
}
