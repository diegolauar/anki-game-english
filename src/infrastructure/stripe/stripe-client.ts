import Stripe from "stripe";

/**
 * Sem `apiVersion` fixado de propósito — usa a versão padrão da conta Stripe
 * em vez de travar numa data que pode ficar desatualizada no código.
 */
export function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set.");

  return new Stripe(secretKey);
}
