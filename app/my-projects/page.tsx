"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"

const draftProjects = [
  { id: "p1", name: "Chrome Sunrise Draft", updated: "2 hours ago", step: "Slicing 60%" },
  { id: "p2", name: "Momentum Perc Kit", updated: "Yesterday", step: "Ready to publish" },
]

export default function MyProjectsPage() {
  return (
    <div className="w-full max-w-5xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Workflow"
        title="My Projects"
        description="Pick up where you left off, fine-tune slices, and turn drafts into finished drops."
        actions={
          <Link href="/create">
            <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
              Resume slicing
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {draftProjects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">Draft</p>
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-sm text-white/60">Updated {project.updated}</p>
              <p className="text-xs text-white/50">{project.step}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                Resume
              </Button>
              <Link href="/my-library">
                <Button variant="ghost" className="rounded-full border border-white/20 text-white/70 hover:bg-white/10">
                  View kits
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
