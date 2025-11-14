"use client"

import { Card, CardContent } from "@/components/ui/card"

const featureTiles = [
  { title: "Glass Control Room", description: "Precision knobs, fades, and AI cleanups in one interface." },
  { title: "Smart Metadata", description: "Auto-tag kits with mood, BPM, and key for instant drops." },
  { title: "Live Collaboration", description: "Invite co-creators, share slices, and version kits in sync." },
]

const stats = [
  { label: "Kits Published", value: "12.4K" },
  { label: "Slices per Minute", value: "480+" },
  { label: "Creators Online", value: "3,205" },
]

export default function AboutPage() {
  return (
    <div className="px-4 py-10 md:px-12 lg:px-16">
      <div className="max-w-5xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Platform</p>
          <h1 className="font-display text-4xl text-white">About DrumKitzz</h1>
          <p className="text-white/70">Built for producers creating the sound of tomorrow.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-2 p-4">
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featureTiles.map((tile) => (
            <Card key={tile.title} className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-2 p-4">
                <p className="text-lg font-semibold">{tile.title}</p>
                <p className="text-sm text-white/60">{tile.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
