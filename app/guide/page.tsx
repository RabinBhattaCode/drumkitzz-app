"use client"

import { PageHero } from "@/components/page-hero"

const steps = [
  { title: "Capture", description: "Upload stems, drag audio, or record directly into DrumKitzz." },
  { title: "Sculpt", description: "Trim transients, add fades, and auto-extract drums before slicing." },
  { title: "Drop", description: "Export slices with metadata and push them into your library or marketplace." },
]

export default function GuidePage() {
  return (
    <div className="w-full max-w-5xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero eyebrow="Workflow" title="Guide" description="A quick playbook for turning raw audio into sellable kits." />
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Step {index + 1}</p>
            <p className="text-lg font-semibold">{step.title}</p>
            <p className="text-sm text-white/70">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
