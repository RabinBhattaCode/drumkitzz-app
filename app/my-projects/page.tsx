"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"
import { createBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { loadProject as loadProjectFromApi } from "@/lib/projects"
import { downloadProjectZip } from "@/lib/download-kit"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ProjectRow = {
  id: string
  title: string | null
  status: string | null
  updated_at: string | null
  created_at: string | null
  slice_settings?: Record<string, unknown> | null
  cover_image_path?: string | null
}

export default function MyProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [downloadModal, setDownloadModal] = useState<{
    open: boolean
    status: "preparing" | "error"
    message?: string
  }>({ open: false, status: "preparing" })
  const audioContextRef = useRef<AudioContext | null>(null)
  const [updatingVisibility, setUpdatingVisibility] = useState<Record<string, boolean>>({})
  const [updatingPrice, setUpdatingPrice] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setProjects([])
        setIsLoaded(true)
        setLoadError(null)
        return
      }
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from("kit_projects")
          .select("id,title,status,updated_at,created_at,slice_settings")
          .order("updated_at", { ascending: false })
        if (error) {
          console.error("Failed to load projects", error)
          setProjects([])
          setLoadError(error.message || "Could not load projects.")
        } else {
          setProjects(data || [])
          setLoadError(null)
        }
      } catch (err) {
        console.error("Failed to load projects", err)
        setProjects([])
        setLoadError(err instanceof Error ? err.message : "Could not load projects.")
      } finally {
        setIsLoaded(true)
      }
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

  const statusLabel = (status?: string | null) => {
    if (status === "published") return "Published"
    if (status === "ready") return "Unlisted"
    if (status === "archived") return "Archived"
    return "Draft"
  }

  const setVisibility = async (id: string, visibility: "published" | "private" | "unlisted" | "draft") => {
    const statusValue = visibility === "published" ? "published" : visibility === "unlisted" ? "ready" : "draft"
    const supabase = createBrowserClient()
    setUpdatingVisibility((prev) => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase.from("kit_projects").update({ status: statusValue }).eq("id", id)
      if (error) {
        console.error("Failed to update visibility", error)
        toast({
          title: "Visibility not updated",
          description: "Could not update visibility. Please try again.",
          variant: "destructive",
        })
      } else {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: statusValue } : p)))
        toast({
          title: "Visibility updated",
          description: `Project is now ${statusLabel(statusValue).toLowerCase()}.`,
        })
      }
    } finally {
      setUpdatingVisibility((prev) => ({ ...prev, [id]: false }))
    }
  }

  const detectCurrency = () => {
    if (typeof navigator === "undefined") return "USD"
    const locale = navigator.language.toLowerCase()
    if (locale.includes("gb") || locale.includes("en-gb")) return "GBP"
    return "USD"
  }

  const formatPriceLabel = (project: ProjectRow) => {
    const price = (project.slice_settings as any)?.price
    if (!price || price.amountCents === undefined || price.isFree) return "Free"
    const amount = (price.amountCents / 100).toFixed(2)
    const symbol = price.currency === "GBP" ? "£" : "$"
    return `${symbol}${amount}`
  }

  const handleSetPrice = async (project: ProjectRow) => {
    const supabase = createBrowserClient()
    const existingPrice = (project.slice_settings as any)?.price
    const currency = existingPrice?.currency || detectCurrency()
    const input = window.prompt(`Set price in ${currency}. Enter 0 for free.`, existingPrice?.amountCents ? (existingPrice.amountCents / 100).toString() : "0")
    if (input === null) return
    const value = input.trim().toLowerCase() === "free" ? 0 : Number.parseFloat(input)
    if (!Number.isFinite(value) || value < 0) {
      toast({
        title: "Invalid price",
        description: "Enter a number 0 or greater.",
        variant: "destructive",
      })
      return
    }
    const priceCents = Math.round(value * 100)
    setUpdatingPrice((prev) => ({ ...prev, [project.id]: true }))
    try {
      const { data, error: fetchError } = await supabase
        .from("kit_projects")
        .select("slice_settings")
        .eq("id", project.id)
        .single()
      if (fetchError) {
        throw fetchError
      }
      const existing = (data?.slice_settings as Record<string, unknown>) || {}
      const nextSettings = { ...existing, price: { amountCents: priceCents, currency, isFree: priceCents === 0 } }
      const { error: updateError } = await supabase.from("kit_projects").update({ slice_settings: nextSettings }).eq("id", project.id)
      if (updateError) {
        throw updateError
      }
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, slice_settings: nextSettings } : p)),
      )
      toast({
        title: "Price saved",
        description: priceCents === 0 ? "Marked as free." : `Set to ${(priceCents / 100).toFixed(2)} ${currency}.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Price not saved",
        description: "Could not update price. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPrice((prev) => ({ ...prev, [project.id]: false }))
    }
  }

  const writeString = (view: DataView, offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels
    const length = buffer.length * numberOfChannels * 2
    const sampleRate = buffer.sampleRate

    const wavHeader = new ArrayBuffer(44)
    const view = new DataView(wavHeader)

    writeString(view, 0, "RIFF")
    view.setUint32(4, 36 + length, true)
    writeString(view, 8, "WAVE")
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, "data")
    view.setUint32(40, length, true)

    const audioData = new Int16Array(buffer.length * numberOfChannels)
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]))
        audioData[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      }
    }

    return new Blob([wavHeader, audioData], { type: "audio/wav" })
  }

  const applyFades = (source: AudioBuffer, start: number, end: number, fadeInMs: number, fadeOutMs: number) => {
    const sampleRate = source.sampleRate
    const startSample = Math.floor(start * sampleRate)
    const endSample = Math.floor(end * sampleRate)
    const length = Math.max(0, endSample - startSample)
    const out = audioContextRef.current?.createBuffer(source.numberOfChannels, length, sampleRate)
    if (!out) return null
    for (let channel = 0; channel < source.numberOfChannels; channel++) {
      const src = source.getChannelData(channel)
      const dst = out.getChannelData(channel)
      const fadeInSamples = Math.floor((fadeInMs / 1000) * sampleRate)
      const fadeOutSamples = Math.floor((fadeOutMs / 1000) * sampleRate)
      for (let i = 0; i < length; i++) {
        let sample = src[startSample + i] || 0
        if (i < fadeInSamples && fadeInSamples > 0) {
          sample *= i / fadeInSamples
        }
        if (i > length - fadeOutSamples && fadeOutSamples > 0) {
          sample *= (length - i) / fadeOutSamples
        }
        dst[i] = sample
      }
    }
    return out
  }

  const handleDownloadProject = async (project: ProjectRow) => {
    setDownloadModal({ open: true, status: "preparing", message: "Building your download..." })
    try {
      await downloadProjectZip(project.id, project.title || "DrumKitzz_Kit")
      setDownloadModal({ open: false, status: "preparing" })
    } catch (err) {
      console.error(err)
      setDownloadModal({
        open: true,
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong while preparing your kit.",
      })
    }
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

  const handleArtworkUpload = async (project: ProjectRow, file: File) => {
    const supabase = createBrowserClient()
    const ext = file.name.split(".").pop() || "png"
    const path = `artwork/${project.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from("kit-artwork").upload(path, file, { upsert: true })
    if (uploadError) {
      console.error(uploadError)
      toast({
        title: "Upload failed",
        description: "Could not upload artwork. Check storage bucket and try again.",
        variant: "destructive",
      })
      return
    }

    const { data: publicUrlData } = supabase.storage.from("kit-artwork").getPublicUrl(path)
    const publicUrl = publicUrlData?.publicUrl

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, slice_settings: { ...(p.slice_settings || {}), artwork: publicUrl } } : p,
      ),
    )

    const { data, error: fetchError } = await supabase
      .from("kit_projects")
      .select("slice_settings")
      .eq("id", project.id)
      .single()
    if (fetchError) {
      console.error(fetchError)
      return
    }
    const existing = (data?.slice_settings as Record<string, unknown>) || {}
    const nextSettings = { ...existing, artwork: publicUrl }
    const { error: updateError } = await supabase.from("kit_projects").update({ slice_settings: nextSettings }).eq("id", project.id)
    if (updateError) {
      console.error(updateError)
    }
  }

  const renderProjectList = (list: ProjectRow[], sectionLabel: string, emptyCta = true) => {
    if (!isLoaded) {
      return (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-center text-white/60">
          Loading projects...
        </div>
      )
    }
    if (loadError) {
      return (
        <div className="rounded-[24px] border border-red-400/30 bg-red-500/5 p-6 text-center text-red-200">
          {loadError}
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
      <div className="space-y-7">
        {list.map((project) => (
          <div
            key={project.id}
            className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-black/30 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)] md:flex-row md:items-center md:gap-5"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">{sectionLabel}</p>
              <h2 className="text-xl font-semibold leading-tight whitespace-nowrap">{project.title || "Untitled Project"}</h2>
              <p className="text-sm text-white/60">Updated {formatUpdated(project.updated_at || project.created_at)}</p>
            </div>
            <div className="ml-auto flex w-full flex-wrap items-center gap-2.5 md:w-auto md:flex-nowrap md:gap-3 md:justify-end">
              <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap md:gap-3">
                <Link href={`/create?projectId=${project.id}`} prefetch={false}>
                  <Button className="h-10 rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] px-4 text-sm font-medium text-black hover:brightness-110">
                    Edit project
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="h-10 rounded-full border border-white/20 px-4 text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-white"
                  onClick={() => deleteProject(project.id)}
                >
                  Delete
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full border border-white/20 bg-transparent px-4 text-sm font-medium text-white/80 hover:text-white"
                      disabled={!!updatingVisibility[project.id]}
                    >
                      {updatingVisibility[project.id] ? "Updating..." : `Visibility: ${statusLabel(project.status)}`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Set visibility</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setVisibility(project.id, "published")}>Published</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibility(project.id, "private")}>Draft / Private</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibility(project.id, "unlisted")}>Unlisted</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="h-px w-full border-t border-white/10 md:hidden" aria-hidden />
              <div className="flex items-center gap-3 md:pl-6">
                <label className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs uppercase tracking-wide text-white/60 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.8)] hover:bg-white/10">
                  {project.slice_settings?.artwork || project.cover_image_path ? (
                    <img
                      src={(project.slice_settings as any)?.artwork || project.cover_image_path || "/placeholder.svg"}
                      alt="Artwork"
                      className="absolute inset-0 h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <span>Art</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleArtworkUpload(project, file)
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap md:gap-3">
                <Button
                  variant="outline"
                  className="h-10 rounded-full border border-white/20 bg-transparent px-4 text-sm font-medium text-white/80 hover:text-white"
                  onClick={() => handleDownloadProject(project)}
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-full border border-emerald-400/50 bg-transparent px-4 text-sm font-medium text-emerald-100 hover:bg-emerald-500/10 hover:text-white"
                  onClick={() => handleSetPrice(project)}
                  disabled={!!updatingPrice[project.id]}
                >
                  {updatingPrice[project.id] ? "Saving..." : `Price: ${formatPriceLabel(project)}`}
                </Button>
              </div>
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
            <Link href="/create">
              <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                Create
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

      <Dialog open={downloadModal.open} onOpenChange={(open) => !open && setDownloadModal({ open: false, status: "preparing" })}>
        <DialogContent className="border border-white/10 bg-[#0c0a11] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Preparing drum kit…</DialogTitle>
            <DialogDescription className="text-white/60">
              Exporting your slices without leaving this page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            {downloadModal.status === "preparing" ? (
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f5d97a]" />
            ) : (
              <div className="h-10 w-10 rounded-full border-2 border-red-400/70 text-red-400 flex items-center justify-center text-sm">
                !
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {downloadModal.status === "preparing" ? "Building your download…" : "Export failed"}
              </p>
              {downloadModal.status === "error" && (
                <p className="text-xs text-white/60">
                  {downloadModal.message || "Something went wrong. Try again from the editor."}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
