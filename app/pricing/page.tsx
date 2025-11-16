"use client"

import { PageHero } from "@/components/page-hero"
import { PricingPlans } from "@/components/pricing/pricing-plans"

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Billing"
        title="Pricing"
        description="Preview the upcoming tiers below—identical to what you see on the marketing site."
      />
      <PricingPlans />
    </div>
  )
}
