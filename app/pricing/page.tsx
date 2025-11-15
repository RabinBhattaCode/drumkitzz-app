"use client"

import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"

const tiers = [
  {
    name: "Creator",
    price: "Included",
    description: "Upload, slice, and export with watermark.",
    features: ["Unlimited drafts", "Glass control room", "Community sharing"],
  },
  {
    name: "Studio",
    price: "$24/mo",
    description: "Lossless exports, metadata automation, and private drops.",
    features: ["Lossless exports", "Metadata AI", "Private sharing", "Priority support"],
  },
]

export default function PricingPage() {
  return (
    <div className="w-full max-w-5xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Billing"
        title="Pricing"
        description="Phase 7 will reintroduce full billing controls. Preview the upcoming tiers below."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="space-y-4 rounded-[32px] border border-white/10 bg-black/30 p-6 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">{tier.name}</p>
              <p className="text-3xl font-semibold">{tier.price}</p>
              <p className="text-sm text-white/70">{tier.description}</p>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full rounded-full border border-white/30 text-white hover:bg-white/10"
              disabled
            >
              Coming soon
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
