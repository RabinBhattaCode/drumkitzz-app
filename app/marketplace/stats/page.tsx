"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign } from "lucide-react"

const cards = [
  { label: "Monthly Sales", value: "$48.7K", change: "+12%", icon: DollarSign },
  { label: "Active Buyers", value: "8.2K", change: "+8%", icon: Users },
  { label: "Trending Velocity", value: "92 index", change: "+5%", icon: TrendingUp },
]

export default function MarketplaceStatsPage() {
  return (
    <div className="px-4 py-10 md:px-12 lg:px-16">
      <div className="max-w-5xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Marketplace</p>
          <h1 className="font-display text-4xl text-white">Performance stats</h1>
          <p className="text-white/70">Track global kit sales, buyers, and cultural momentum.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label} className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-3 p-4">
                <card.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-white/60">{card.label}</p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
                <p className="text-xs text-emerald-300">{card.change} vs last month</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
