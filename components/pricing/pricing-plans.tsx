"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { pricingTiers, currencyMeta, regionCurrencyMap } from "@/lib/pricing"

type PricingPlansProps = {
  className?: string
  showHeader?: boolean
  eyebrow?: string
  title?: string
  description?: string
}

const getRegionFromLanguage = (language: string) => {
  const region = language.split("-")[1]?.toUpperCase()
  return region && regionCurrencyMap[region] ? regionCurrencyMap[region] : "USD"
}

export function PricingPlans({
  className,
  showHeader = true,
  eyebrow = "Pricing",
  title = "Choose your plan",
  description = "Currency shown in {{currency}}, rounded to the nearest whole number.",
}: PricingPlansProps) {
  const [currency, setCurrency] = useState<keyof typeof currencyMeta>("USD")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrency(getRegionFromLanguage(navigator.language || "en-US"))
    }
  }, [])

  const meta = currencyMeta[currency]
  const localizedTiers = useMemo(
    () =>
      pricingTiers.map((tier) => {
        const localizedPrice = tier.price === 0 ? 0 : Math.round(tier.price * meta.rate)
        return {
          ...tier,
          display: tier.price === 0 ? "Free" : `${meta.symbol}${localizedPrice}${meta.suffix}`,
        }
      }),
    [meta],
  )

  return (
    <div className={cn("space-y-6 text-white", className)}>
      {showHeader && (
        <div className="flex flex-col gap-3">
          {eyebrow && <p className="text-xs uppercase tracking-[0.4em] text-white/50">{eyebrow}</p>}
          {title && <h2 className="font-display text-3xl">{title}</h2>}
          {description && (
            <p className="text-white/70">{description.replace("{{currency}}", meta.label ?? currency)}</p>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {localizedTiers.map((tier) => (
          <div key={tier.id} className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">{tier.name}</p>
              {tier.id === "creator" && (
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-200">Popular</span>
              )}
            </div>
            <p className="mt-2 text-sm text-white/60">{tier.description}</p>
            <p className="mt-6 text-3xl font-semibold">{tier.display}</p>
            <p className="text-sm text-white/60">{tier.perk}</p>
            <Button className="mt-6 w-full rounded-full bg-amber-400 text-black hover:bg-amber-300">
              {tier.id === "creator" ? "Selected" : "Choose plan"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
