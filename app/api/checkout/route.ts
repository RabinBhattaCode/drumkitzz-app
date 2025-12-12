import { NextResponse } from "next/server"

import { assertStripeConfigured, stripe } from "@/lib/stripe"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server"
import { pricingTiers } from "@/lib/pricing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CheckoutRequest = {
  priceId?: string
  quantity?: number
  successUrl?: string
  cancelUrl?: string
  mode?: "subscription" | "payment"
}

const getOrigin = (req: Request) => req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function POST(req: Request) {
  try {
    assertStripeConfigured()

    const supabase = await createRouteHandlerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    const userEmail = session?.user?.email ?? undefined

    const body = (await req.json()) as CheckoutRequest
    const priceId = body.priceId

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 })
    }

    const successUrl = body.successUrl ?? `${getOrigin(req)}/pricing?status=success`
    const cancelUrl = body.cancelUrl ?? `${getOrigin(req)}/pricing?status=cancelled`

    const tierFromPrice = pricingTiers.find((t) => t.stripePriceId === priceId)?.id

    const checkoutSession = await stripe!.checkout.sessions.create({
      mode: body.mode ?? "subscription",
      line_items: [
        {
          price: priceId,
          quantity: body.quantity ?? 1,
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data:
        body.mode === "payment"
          ? undefined
          : {
              trial_period_days: undefined,
              metadata: {
                user_id: userId ?? "",
                tier_id: tierFromPrice ?? "",
              },
            },
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId ?? undefined,
      customer_email: userEmail,
      metadata: {
        user_id: userId ?? "",
        tier_id: tierFromPrice ?? "",
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("[api/checkout] error", error)
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: error?.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500 },
    )
  }
}
