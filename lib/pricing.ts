export type PricingTierId = "free" | "creator" | "vip"

export const pricingTiers = [
  {
    id: "free" as PricingTierId,
    name: "Free",
    price: 0,
    description: "Sample kits with limited AI credits.",
    perk: "10 stems / mo",
  },
  {
    id: "creator" as PricingTierId,
    name: "Tier 2",
    price: 8,
    description: "Unlimited slicing plus private libraries.",
    perk: "Unlimited uploads",
  },
  {
    id: "vip" as PricingTierId,
    name: "Tier 3",
    price: 15,
    description: "Priority AI queue and collaboration slots.",
    perk: "Priority AI + collabs",
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
