"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const draftProjects = [
  { id: "p1", name: "Chrome Sunrise Draft", updated: "2 hours ago", step: "Slicing 60%" },
  { id: "p2", name: "Momentum Perc Kit", updated: "Yesterday", step: "Ready to publish" },
]

export default function MyProjectsPage() {
  return (
    <div className="px-4 py-10 md:px-12 lg:px-16">
      <div className="max-w-4xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Drafts</p>
          <h1 className="font-display text-4xl text-white">My Projects</h1>
          <p className="text-white/70">Resume unfinished slicing sessions or push drafts into finished kits.</p>
        </div>
        <div className="grid gap-4">
          {draftProjects.map((project) => (
            <Card key={project.id} className="border-white/10 bg-white/5 text-white">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-lg font-semibold">{project.name}</p>
                  <p className="text-sm text-white/60">Updated {project.updated}</p>
                  <p className="text-xs text-white/50">{project.step}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                    Resume
                  </Button>
                  <Link href="/my-library">
                    <Button variant="ghost" className="rounded-full border border-white/20 text-white/70 hover:bg-white/10">
                      View kits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
