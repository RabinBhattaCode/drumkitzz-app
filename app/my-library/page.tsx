"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHero } from "@/components/page-hero"
import { createBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/lib/auth-context"

type KitRow = {
  id: string
  name: string
  status: string | null
  visibility: string | null
  updated_at: string | null
  created_at: string | null
  cover_image_path: string | null
  like_count: number | null
  download_count: number | null
  asset_count?: number
}

export default function MyLibraryPage() {
  const { user } = useAuth()
  const [kits, setKits] = useState<KitRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setKits([])
        setIsLoaded(true)
        return
      }
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("kits")
        .select("id,name,status,visibility,updated_at,created_at,cover_image_path,like_count,download_count,kit_assets(count)")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
      if (error) {
        console.error("Failed to load kits", error)
        setKits([])
      } else {
        const mapped =
          data?.map((k: any) => ({
            ...k,
            asset_count: k.kit_assets?.[0]?.count ?? 0,
          })) || []
        setKits(mapped)
      }
      setIsLoaded(true)
    }
    void load()
  }, [user])

  const deleteKit = async (id: string) => {
    const res = await fetch("/api/library", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kitId: id }),
    })
    if (!res.ok) {
      console.error("Failed to delete kit", await res.text())
      return
    }
    setKits((prev) => prev.filter((k) => k.id !== id))
  }

  const downloadKit = async (id: string) => {
    window.location.href = `/api/kits/${id}/download`
  }

  const stats = useMemo(() => {
    const total = kits.length
    const drafts = kits.filter((k) => (k.status || "draft") === "draft").length
    const published = kits.filter((k) => (k.status || "draft") !== "draft").length
    return { total, drafts, published }
  }, [kits])

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

  return (
    <div className="w-full max-w-6xl space-y-10 px-4 py-14 lg:px-0 mx-auto">
      <PageHero
        eyebrow="Library"
        title="My Kits"
        description="Manage your saved and published kits. Open to edit, re-export, or share."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/create">
              <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
                Create new kit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 text-white/70">
        <Badge variant="outline" className="border-white/20 text-white">
          Kits: {stats.total}
        </Badge>
        <Badge variant="outline" className="border-white/20 text-white">
          Drafts: {stats.drafts}
        </Badge>
        <Badge variant="outline" className="border-white/20 text-white">
          Published: {stats.published}
        </Badge>
      </div>

      {!isLoaded ? (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-center text-white/60">Loading kits...</div>
      ) : !user ? (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-center text-white/60">Sign in to view your kits.</div>
      ) : kits.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/20 bg-black/20 p-8 text-center text-white/60">
          <p>No kits in your library yet.</p>
          <Link href="/create" className="mt-4 inline-flex">
            <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">Make a kit</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <div key={kit.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white shadow">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-white/20 text-xs uppercase tracking-[0.3em]">
                  {kit.status || "draft"}
                </Badge>
                <span className="text-xs text-white/50">{kit.visibility === "public" ? "Public" : "Private"}</span>
              </div>
              <div className="mt-3">
                <p className="text-lg font-semibold">{kit.name}</p>
                <p className="text-xs text-white/60">Updated {formatUpdated(kit.updated_at || kit.created_at)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>Sounds: {kit.asset_count ?? 0}</span>
                <span>❤️ {kit.like_count ?? 0}</span>
                <span>⬇️ {kit.download_count ?? 0}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/marketplace/drumkit/${kit.id}`} prefetch={false}>
                  <Button variant="outline" className="w-full rounded-full border-white/20 text-white/80 hover:text-white">
                    View
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-white/20 text-white/80 hover:text-white"
                  onClick={() => downloadKit(kit.id)}
                >
                  Download
                </Button>
                <Button
                  variant="ghost"
                  className="w-full rounded-full border-white/20 text-white/80 hover:bg-red-500/20 hover:text-white"
                  onClick={() => deleteKit(kit.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
