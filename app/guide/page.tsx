"use client"

import { Card, CardContent } from "@/components/ui/card"

const steps = [
  { title: "Capture", description: "Upload stems, drag audio, or record directly into DrumKitzz." },
  { title: "Sculpt", description: "Trim transients, add fades, and auto-extract drums before slicing." },
  { title: "Drop", description: "Export slices with metadata and push them into your library or marketplace." },
]

export default function GuidePage() {
  return (
    <div className="px-4 py-10 md:px-12 lg:px-16">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Workflow</p>
          <h1 className="font-display text-4xl text-white">Guide</h1>
          <p className="text-white/70">A quick playbook for turning raw audio into sellable kits.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Step {index + 1}</p>
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="text-sm text-white/60">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
