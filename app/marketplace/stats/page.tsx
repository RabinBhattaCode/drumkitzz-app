"use client"

import { useEffect } from "react"
import { TrendingUp, Users, DollarSign } from "lucide-react"

import { PageHero } from "@/components/page-hero"
import { useAuth } from "@/lib/auth-context"

const cards = [
  { label: "Monthly Sales", value: "$48.7K", change: "+12%", icon: DollarSign, helper: "vs last month" },
  { label: "Active Buyers", value: "8.2K", change: "+8%", icon: Users, helper: "unique accounts" },
  { label: "Trending Velocity", value: "92 index", change: "+5%", icon: TrendingUp, helper: "culture momentum" },
]

export default function MarketplaceStatsPage() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-auth-overlay", { detail: { mode: "login" } }))
    }
  }, [isAuthenticated, isLoading])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center text-white">
        <h2 className="text-3xl font-semibold">Sign in to view marketplace stats</h2>
        <p className="text-white/70">
          Performance dashboards are available to DrumKitzz members. Log in or create an account to keep tracking kit revenue and demand.
        </p>
        <button
          className="rounded-full border border-white/20 px-6 py-2 text-sm uppercase tracking-[0.3em] text-white"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-auth-overlay", { detail: { mode: "signup" } }))
          }
        >
          Launch sign-in
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Marketplace"
        title="Performance stats"
        description="Track global kit sales, buyer growth, and cultural velocity at a glance."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[28px] border border-white/10 bg-black/35 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <card.icon className="mb-3 h-5 w-5 text-white/60" />
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">{card.label}</p>
            <p className="text-3xl font-semibold">{card.value}</p>
            <p className="text-sm text-emerald-300">{card.change}</p>
            <p className="text-xs text-white/50">{card.helper}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
