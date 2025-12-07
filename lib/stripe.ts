import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  // We intentionally do not throw to allow the app to boot in environments without Stripe configured.
  console.warn("[stripe] STRIPE_SECRET_KEY is not set. Stripe endpoints will return 500.")
}

export const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2025-06-30.basil",
    typescript: true,
  })

export const assertStripeConfigured = () => {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.")
  }
}
