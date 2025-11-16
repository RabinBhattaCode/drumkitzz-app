"use client"

import { PageHero } from "@/components/page-hero"

const featureTiles = [
  { title: "Glass control room", description: "Precision knobs, fades, and AI cleanups in one interface." },
  { title: "Smart metadata", description: "Auto-tag kits with mood, BPM, and key for instant drops." },
  { title: "Live collaboration", description: "Invite co-creators, share slices, and version kits in sync." },
]

const stats = [
  { label: "Kits published", value: "12.4K" },
  { label: "Slices per minute", value: "480+" },
  { label: "Creators online", value: "3,205" },
]

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Platform"
        title="About DrumKitzz"
        description="Built for producers designing the sound of tomorrow."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">{stat.label}</p>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {featureTiles.map((tile) => (
          <div
            key={tile.title}
            className="rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <p className="text-lg font-semibold">{tile.title}</p>
            <p className="text-sm text-white/70">{tile.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
