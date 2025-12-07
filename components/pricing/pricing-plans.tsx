"use client"

import { useMemo, useState } from "react"

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
  const [currency] = useState<keyof typeof currencyMeta>("USD")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const startCheckout = async (priceId: string | undefined, tierId: string) => {
    if (!priceId) {
      setError("This plan is not available for checkout yet.")
      return
    }

    try {
      setError(null)
      setLoadingId(tierId)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/pricing?status=success&tier=${tierId}`,
          cancelUrl: `${window.location.origin}/pricing?status=cancelled&tier=${tierId}`,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "Failed to start checkout")
      }

      window.location.href = data.url as string
    } catch (err: any) {
      console.error("[pricing] checkout start failed", err)
      setError(err?.message ?? "Could not start checkout. Please try again.")
    } finally {
      setLoadingId(null)
    }
  }

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

      {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {localizedTiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "flex h-full flex-col rounded-[28px] border border-white/10 bg-white/5 p-6 text-white",
              tier.id === "tier4" && "bg-white/10",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-semibold">{tier.name}</p>
              {tier.badge && (
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-200">{tier.badge}</span>
              )}
            </div>
            <p className="mt-2 min-h-[44px] text-sm text-white/60">{tier.description}</p>
            <div className="mt-6 flex flex-col gap-1">
              <p className="text-3xl font-semibold">{tier.display}</p>
              <p className="text-sm text-white/60">{tier.perk}</p>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-white/70">
              {tier.features?.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full rounded-full bg-amber-400 text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!!tier.disabled || tier.id === "free" || loadingId === tier.id}
              onClick={() => startCheckout(tier.stripePriceId, tier.id)}
            >
              {tier.disabled
                ? "Coming soon"
                : tier.id === "free"
                  ? "Included"
                  : loadingId === tier.id
                    ? "Redirecting..."
                    : "Choose plan"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
