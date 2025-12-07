import { NextResponse } from "next/server"
import Stripe from "stripe"

import { assertStripeConfigured, stripe } from "@/lib/stripe"
import { saveSubscription } from "@/lib/stripe-subscriptions"
import { pricingTiers } from "@/lib/pricing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    assertStripeConfigured()

    if (!webhookSecret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 })
    }

    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    const rawBody = Buffer.from(await req.arrayBuffer())
    let event

    try {
      event = stripe!.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err: any) {
      console.error("[api/webhooks/stripe] signature verification failed", err?.message)
      return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message ?? "unknown error"}` }, { status: 400 })
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        {
          const session = event.data.object as Stripe.Checkout.Session
          const subscriptionId = session.subscription as string | undefined
          const customerId = session.customer as string | undefined
          const priceId = (session.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id
          const tierId = pricingTiers.find((t) => t.stripePriceId === priceId)?.id
          await saveSubscription({
            userId: (session.client_reference_id as string | undefined) || (session.metadata?.user_id as string | undefined),
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "active",
            tierId,
            priceId,
          })
          console.info("[stripe] checkout completed", session.id)
        }
        break
      case "invoice.payment_succeeded":
        {
          const invoice = event.data.object as Stripe.Invoice
          const subscriptionId = invoice.subscription as string | undefined
          const customerId = invoice.customer as string | undefined
          const line = invoice.lines?.data?.[0]
          const priceId = (line?.price as Stripe.Price | undefined)?.id
          const tierId = pricingTiers.find((t) => t.stripePriceId === priceId)?.id
          await saveSubscription({
            userId: (invoice.metadata?.user_id as string | undefined) || (invoice.subscription_details?.metadata as any)?.user_id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "active",
            tierId,
            priceId,
            currentPeriodEnd: invoice.lines?.data?.[0]?.period?.end,
            cancelAtPeriodEnd: (invoice.subscription_details as any)?.cancel_at_period_end ?? undefined,
          })
          console.info("[stripe] invoice payment succeeded", invoice.id)
        }
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object as Stripe.Subscription
          const priceId = (subscription.items?.data?.[0]?.price as Stripe.Price | undefined)?.id
          const tierId = pricingTiers.find((t) => t.stripePriceId === priceId)?.id
          await saveSubscription({
            userId: (subscription.metadata?.user_id as string | undefined) ?? undefined,
            stripeCustomerId: subscription.customer as string | undefined,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            tierId,
            priceId,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? undefined,
          })
          console.info("[stripe] subscription event", event.type, subscription.id)
        }
        break
      default:
        console.info("[stripe] unhandled event", event.type)
    }

    // TODO: Persist relevant IDs (customer, subscription, payment) to Supabase once schema is finalized.
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[api/webhooks/stripe] error", error)
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: error?.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500 },
    )
  }
}
