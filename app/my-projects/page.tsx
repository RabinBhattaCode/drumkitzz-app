"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"
import { createBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/lib/auth-context"

type ProjectRow = {
  id: string
  title: string | null
  status: string | null
  updated_at: string | null
  created_at: string | null
}

export default function MyProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setProjects([])
        setIsLoaded(true)
        return
      }
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("kit_projects")
        .select("id,title,status,updated_at,created_at")
        .order("updated_at", { ascending: false })
      if (error) {
        console.error("Failed to load projects", error)
        setProjects([])
      } else {
        setProjects(data || [])
      }
      setIsLoaded(true)
    }
    void load()
  }, [user])

  const deleteProject = async (id: string) => {
    const supabase = createBrowserClient()
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    })
    if (!res.ok) {
      console.error("Failed to delete project", await res.text())
      return
    }
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const drafts = useMemo(
    () =>
      projects
        .filter((p) => (p.status || "draft") === "draft")
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()),
    [projects],
  )
  const finished = useMemo(
    () =>
      projects
        .filter((p) => (p.status || "draft") !== "draft")
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()),
    [projects],
  )

  const formatUpdated = (iso: string | null) => {
    if (!iso) return "Unknown"
    const date = new Date(iso)
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "Just now"
    if (hours === 1) return "1 hour ago"
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return "Yesterday"
    return `${days} days ago`
  }

  const renderProjectList = (list: ProjectRow[], sectionLabel: string, emptyCta = true) => {
    if (!isLoaded) {
      return (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-center text-white/60">
          Loading projects...
        </div>
      )
    }

    if (!user) {
      return (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-center text-white/60">
          Sign in to view your projects.
        </div>
      )
    }

    if (list.length === 0) {
      return (
        <div className="rounded-[28px] border border-dashed border-white/20 bg-black/20 p-8 text-center text-white/60">
          <p>No {sectionLabel.toLowerCase()} projects yet.</p>
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
              <h2 className="text-xl font-semibold">{project.title || "Untitled Project"}</h2>
              <p className="text-sm text-white/60">Updated {formatUpdated(project.updated_at || project.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/create?projectId=${project.id}`} prefetch={false}>
                <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                  Edit project
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="rounded-full border border-white/20 text-white/70 hover:bg-red-500/20 hover:text-white"
                onClick={() => deleteProject(project.id)}
              >
                Delete
              </Button>
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
            <Link href="/my-library">
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
