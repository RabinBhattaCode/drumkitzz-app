import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

type SubscriptionUpsert = {
  userId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status?: string
  tierId?: string
  priceId?: string
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const getServiceClient = () => {
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function saveSubscription(upsert: SubscriptionUpsert) {
  const client = getServiceClient()
  if (!client) {
    console.warn("[stripe] skipping subscription persistence (missing service role envs)")
    return
  }

  const payload = {
    user_id: upsert.userId ?? null,
    stripe_customer_id: upsert.stripeCustomerId ?? null,
    stripe_subscription_id: upsert.stripeSubscriptionId ?? null,
    status: upsert.status ?? null,
    tier_id: upsert.tierId ?? null,
    price_id: upsert.priceId ?? null,
    current_period_end: upsert.currentPeriodEnd
      ? new Date(upsert.currentPeriodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: upsert.cancelAtPeriodEnd ?? null,
  }

  try {
    const { error } = await client
      .from("user_subscriptions")
      .upsert(payload, { onConflict: "user_id" })
    if (error) {
      console.error("[stripe] failed to persist subscription", error.message)
    }
  } catch (err: any) {
    console.error("[stripe] unexpected error persisting subscription", err?.message ?? err)
  }
}
