"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"
import { useKits } from "@/hooks/use-kits"

export default function MyProjectsPage() {
  const { kits, isLoaded } = useKits()
  const drafts = kits.filter((kit) => kit.status === "draft").sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  const finished = kits.filter((kit) => kit.status === "finished").sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

  const formatUpdated = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "Just now"
    if (hours === 1) return "1 hour ago"
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return "Yesterday"
    return `${days} days ago`
  }

  const renderProjectList = (list: typeof kits, sectionLabel: string, emptyCta = true) => {
    if (!isLoaded) {
      return (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-center text-white/60">
          Loading projects...
        </div>
      )
    }

    if (list.length === 0) {
      return (
        <div className="rounded-[28px] border border-dashed border-white/20 bg-black/20 p-8 text-center text-white/60">
          <p>No {sectionLabel.toLowerCase()} kits yet.</p>
          {emptyCta && (
            <Link href="/create" className="mt-4 inline-flex">
              <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                Start slicing
              </Button>
            </Link>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {list.map((project) => (
          <div
            key={project.id}
            className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">{sectionLabel}</p>
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-sm text-white/60">Updated {formatUpdated(project.lastModified)}</p>
              <p className="text-xs text-white/50">
                {project.sliceCount} slices · {project.visibility === "store" ? "Store-ready" : project.visibility === "public" ? "Public" : "Private link"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/create">
                <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                  Open project
                </Button>
              </Link>
              <Link href="/my-kits">
                <Button variant="ghost" className="rounded-full border border-white/20 text-white/70 hover:bg-white/10">
                  View library
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-10 px-4 py-14 lg:px-0 mx-auto">
      <PageHero
        eyebrow="Projects"
        title="Kit Projects"
        description="Every kit stays editable. Jump back into drafts, duplicate sessions, or re-export to your library."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/my-kits">
              <Button variant="outline" className="rounded-full border-white/20 text-white/80 hover:text-white">
                Library
              </Button>
            </Link>
            <Link href="/create">
              <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                Resume slicing
              </Button>
            </Link>
          </div>
        }
      />

      <section className="space-y-6">
        <header className="flex items-center justify-between text-white/70">
          <div>
            <p className="text-sm uppercase tracking-[0.35em]">Draft sessions</p>
            <p className="text-white">Works in progress that aren’t published yet.</p>
          </div>
          <span className="text-xl font-semibold text-white">{drafts.length}</span>
        </header>
        {renderProjectList(drafts, "Draft")}
      </section>

      <section className="space-y-6">
        <header className="flex items-center justify-between text-white/70">
          <div>
            <p className="text-sm uppercase tracking-[0.35em]">Published kits</p>
            <p className="text-white">These live in your library but stay editable here.</p>
          </div>
          <span className="text-xl font-semibold text-white">{finished.length}</span>
        </header>
        {renderProjectList(finished, "Published", false)}
      </section>
    </div>
  )
}
