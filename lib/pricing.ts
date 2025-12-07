export type PricingTierId = "free" | "tier2" | "tier3" | "tier4"

const envPrices = {
  free: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE,
  tier2: process.env.NEXT_PUBLIC_STRIPE_PRICE_TIER2,
  tier3: process.env.NEXT_PUBLIC_STRIPE_PRICE_TIER3,
  tier4: process.env.NEXT_PUBLIC_STRIPE_PRICE_TIER4,
}

export const pricingTiers = [
  {
    id: "free" as PricingTierId,
    name: "Tier 1",
    price: 0,
    description: "For beginners testing the platform.",
    perk: "5 credits/month · 10s per credit",
    features: [
      "Basic slicing tools",
      "Public libraries only",
      "Individual slice downloads",
      "Limited daily uploads",
      "Standard support",
    ],
    badge: "Starter",
    stripePriceId: envPrices.free,
  },
  {
    id: "tier2" as PricingTierId,
    name: "Tier 2",
    price: 9,
    description: "For regular creators who upload consistently.",
    perk: "60 credits/month",
    features: [
      "Increased upload limits",
      "Private libraries",
      "Higher-quality audio processing",
      "Sell up to 3 DrumKits",
      "Standard support",
    ],
    stripePriceId: envPrices.tier2,
  },
  {
    id: "tier3" as PricingTierId,
    name: "Tier 3",
    price: 17,
    description: "For serious producers and active creators.",
    perk: "140 credits/month",
    features: [
      "Increased upload limits",
      "Private libraries",
      "Early access to new tools",
      "Unlimited marketplace listings",
      "Priority support",
    ],
    badge: "Popular",
    stripePriceId: envPrices.tier3,
  },
  {
    id: "tier4" as PricingTierId,
    name: "Tier 4",
    price: 29,
    description: "For professional sound designers.",
    perk: "140 credits/month",
    features: [
      "Loop Kit Maker: 30 minutes",
      "Advanced slicing modes",
      "Increased upload limits",
      "Exclusive creator features",
      "Priority support",
    ],
    disabled: true,
    stripePriceId: envPrices.tier4,
  },
] as const

export const regionCurrencyMap: Record<string, "USD" | "GBP" | "CAD" | "AUD"> = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
  AU: "AUD",
}

export const currencyMeta = {
  USD: { symbol: "$", rate: 1, suffix: "", label: "USD" },
  GBP: { symbol: "£", rate: 0.79, suffix: "", label: "GBP" },
  CAD: { symbol: "$", rate: 1.36, suffix: " CAD", label: "CAD" },
  AUD: { symbol: "$", rate: 1.55, suffix: " AUD", label: "AUD" },
}
