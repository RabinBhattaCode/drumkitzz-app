"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"

type PublicKit = {
  id: string
  name: string
  description: string | null
  cover: string | null
  priceCents: number
  currency: string
  tags: string[]
  owner: { name: string; handle: string }
  downloads: number
  likes: number
}

const PAGE_SIZE = 12

export function Marketplace() {
  const [kits, setKits] = useState<PublicKit[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<"recent" | "oldest" | "popular">("recent")
  const [loadError, setLoadError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchPage = async (pageIndex: number) => {
    setLoading(true)
    const from = pageIndex * PAGE_SIZE
    try {
      const res = await fetch(`/api/marketplace/public?offset=${from}&limit=${PAGE_SIZE}&sort=${sort}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to load kits")
      }
      const body = (await res.json()) as { kits: PublicKit[]; hasMore: boolean }

      setKits((prev) => {
        const deduped = new Map<string, PublicKit>()
        ;[...prev, ...(body.kits || [])].forEach((kit) => deduped.set(kit.id, kit))
        return Array.from(deduped.values())
      })
      setHasMore(body.hasMore)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load public kits right now.")
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPage(0)
  }, [sort])

  const loadMore = () => {
    if (loading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    void fetchPage(nextPage)
  }

  const formatPrice = (kit: PublicKit) => {
    if (!kit.priceCents || kit.priceCents <= 0) return "Free"
    const symbol = kit.currency === "GBP" ? "£" : kit.currency === "EUR" ? "€" : "$"
    return `${symbol}${(kit.priceCents / 100).toFixed(2)}`
  }

  const renderKitCard = (kit: PublicKit) => (
    <Link
      key={kit.id}
      href={`/marketplace/drumkit/${kit.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="relative aspect-square w-full bg-black/40">
        <Image
          src={
            kit.cover ||
            "https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png?updatedAt=1763080146104"
          }
          alt={kit.name}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 300px, 45vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {kit.tags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {kit.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-white/15 text-[11px] uppercase tracking-[0.2em]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">{kit.owner.name}</p>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">{formatPrice(kit)}</span>
        </div>
        <h3 className="text-lg font-semibold leading-tight group-hover:text-white">{kit.name}</h3>
        {kit.description && <p className="line-clamp-2 text-sm text-white/60">{kit.description}</p>}
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>⬇️ {kit.downloads}</span>
          <span>❤️ {kit.likes}</span>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0a0b12] via-[#0b0e1c] to-[#05060b] p-8 text-white shadow-[0_35px_100px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#f5d97a]/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#6b738b]/15 blur-[140px]" />
        </div>
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Marketplace</p>
            <h1 className="text-3xl font-semibold leading-tight">Explore public drum kits</h1>
            <p className="text-white/70">
              Browse only public kits. Use tags to jump into categories other producers used.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">All public kits</p>
            <h2 className="text-2xl font-semibold">Latest drops</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                const next = e.target.value as typeof sort
                setSort(next)
                setPage(0)
              }}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-white"
            >
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most popular</option>
            </select>
            <div className="text-white/60">{kits.length} kits</div>
          </div>
        </div>

        {kits.length === 0 && !loading ? (
          <Card className="border-white/10 bg-black/30 text-white">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p>{loadError || "No public kits match this tag yet."}</p>
              <Button asChild variant="outline">
                <Link href="/create">Publish a kit</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{kits.map(renderKitCard)}</div>
        )}

        <div className="flex items-center justify-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : hasMore ? (
            <Button variant="outline" className="rounded-full border-white/20 text-white" onClick={loadMore}>
              Load more
            </Button>
          ) : (
            kits.length > 0 && <p className="text-sm text-white/50">You’ve reached the end.</p>
          )}
        </div>
      </div>
    </div>
  )
}
