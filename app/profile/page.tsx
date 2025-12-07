"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Music, Download, Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createBrowserClient } from "@/lib/supabase-browser"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [kits, setKits] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [purchaseModal, setPurchaseModal] = useState<{ open: boolean; kit?: any }>({ open: false })
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    } else if (isAuthenticated) {
      const load = async () => {
        try {
          setIsFetching(true)
          const supabase = createBrowserClient()
          const { data, error } = await supabase
            .from("kits")
            .select(
              "id,name,description,cover_image_path,status,visibility,download_count,like_count,updated_at,created_at,price_cents,currency,bundle_path",
            )
            .eq("owner_id", user?.id)
            .or("visibility.in.(public,unlisted),status.in.(published,ready)")
            .order("updated_at", { ascending: false })

          if (error) {
            console.error("Failed to load kits", error)
            toast({
              title: "Could not load kits",
              description: "Public and unlisted kits failed to load. Please try again.",
              variant: "destructive",
            })
            setKits([])
          } else {
            setKits(data || [])
          }
        } finally {
          setIsFetching(false)
        }
      }
      void load()
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex items-center gap-2 text-white/70">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-l-white" />
          Loading your profile…
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription className="text-white/70">Please sign in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const stats = {
    totalKits: kits.length,
    totalDownloads: kits.reduce((sum, kit) => sum + (kit.download_count || 0), 0),
    totalLikes: kits.reduce((sum, kit) => sum + (kit.like_count || 0), 0),
    totalComments: 0,
  }

  const heroImage = kits[0]?.cover_image_path || "/images/default-hero.jpg"
  const handle = user.username || user.email?.split("@")[0] || "producer"
  const tags = ["Drum kits", "Electronic", "Loop kit", "Synth-pop"].slice(0, 4)
  const formatPrice = (kit: any) => {
    if (!kit || kit.price_cents === null || kit.price_cents === undefined || kit.price_cents <= 0) return "Free"
    const symbol = (kit.currency || "USD") === "GBP" ? "£" : "$"
    return `${symbol}${(kit.price_cents / 100).toFixed(2)}`
  }

  const handleDownload = (kit: any) => {
    const priceLabel = formatPrice(kit)
    const isFree = priceLabel === "Free"
    if (isFree) {
      toast({
        title: "Download starting",
        description: `Preparing ${kit.name || "your kit"}…`,
      })
      // Hook up real download using bundle_path or assets when available
      return
    }
    setPurchaseModal({ open: true, kit })
  }

  return (
    <div className="min-h-screen bg-[#0b0a10] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:px-0">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#101424] via-[#0b0f1c] to-[#0b0a10] p-6 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,217,122,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(18,183,106,0.08),transparent_30%)]" />
          {heroImage && (
            <img
              src={heroImage}
              alt="Profile backdrop"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-6 md:flex-row md:items-end">
              <Avatar className="h-28 w-28 border-4 border-white/40 shadow-lg shadow-black/40">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback className="text-3xl">{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold leading-tight">{user.username || "Producer"}</h1>
                  <Badge variant="secondary" className="bg-white/15 text-white hover:bg-white/20">
                    Creator
                  </Badge>
                </div>
                <p className="text-white/70">@{handle}</p>
                <p className="max-w-3xl text-lg text-white/80">
                  Music producer and drum kit creator crafting unique sounds for the community.
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} className="bg-white/10 text-white hover:bg-white/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-6 text-white/80">
                  <Stat label="Kits" value={stats.totalKits} />
                  <Stat label="Downloads" value={stats.totalDownloads} />
                  <Stat label="Likes" value={stats.totalLikes} />
                  <Stat label="Comments" value={stats.totalComments} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
              <div className="flex gap-3">
                <Button className="rounded-full bg-white text-black hover:brightness-110" onClick={() => router.push("/settings")}>
                  Edit profile
                </Button>
                <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
              <Button variant="ghost" className="rounded-full border border-white/20 text-white/80 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">Featured Kits</p>
              <h2 className="text-2xl font-semibold">Your published & unlisted kits</h2>
            </div>
            <p className="text-white/60">Showing {kits.length || 0}</p>
          </div>

          {isFetching ? (
            <div className="flex items-center gap-2 text-white/70">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-l-white" />
              Loading your kits…
            </div>
          ) : kits.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/70">
              <Music className="mx-auto mb-4 h-10 w-10 text-white/60" />
              <p>No published or unlisted kits yet.</p>
              <Button className="mt-4 rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110" onClick={() => router.push("/create")}>
                Create your first kit
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {kits.map((kit) => (
                <div
                  key={kit.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="relative aspect-[4/3]">
                    <img
                      src={kit.cover_image_path || "/placeholder.svg"}
                      alt={kit.name || "Kit cover"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute left-3 top-3">
                      <Badge className="rounded-full bg-white/15 text-white backdrop-blur-md">
                        {kit.status === "ready" ? "Unlisted" : kit.status || "Published"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {kit.download_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {kit.like_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-tight">{kit.name || "Untitled Kit"}</h3>
                      <Badge variant="outline" className="rounded-full border-white/20 text-white/70">
                        {kit.visibility || kit.status || "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2">
                      {kit.description || "No description yet. Add a short blurb to help fans discover this kit."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>
                        {kit.updated_at
                          ? formatDistanceToNow(new Date(kit.updated_at), { addSuffix: true })
                          : formatDistanceToNow(new Date(kit.created_at || Date.now()), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {kit.comment_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] px-4 text-black hover:brightness-110"
                        onClick={() => router.push(`/my-kits/${kit.id}`)}
                      >
                        Edit kit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-white/25 bg-transparent px-4 text-white hover:bg-white/10"
                        onClick={() => router.push(`/my-kits/${kit.id}`)}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto rounded-full border-white/25 bg-transparent px-4 text-white hover:bg-white/10"
                        onClick={() => handleDownload(kit)}
                      >
                        {formatPrice(kit) === "Free" ? "Download" : `Price: ${formatPrice(kit)}`}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={purchaseModal.open} onOpenChange={(open) => setPurchaseModal({ open, kit: purchaseModal.kit })}>
        <DialogContent className="border border-white/10 bg-[#0c0a11] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Purchase required</DialogTitle>
            <CardDescription className="text-white/70">
              {purchaseModal.kit?.name ? `${purchaseModal.kit.name} is a paid kit.` : "This kit is paid."}
            </CardDescription>
          </DialogHeader>
          <p className="text-sm text-white/80">
            Price: {purchaseModal.kit ? formatPrice(purchaseModal.kit) : "—"}. Connect billing to continue.
          </p>
          <DialogFooter className="mt-4 flex items-center justify-end gap-3">
            <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" onClick={() => setPurchaseModal({ open: false })}>
              Close
            </Button>
            <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
              Continue to purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-semibold leading-none">{value}</span>
      <span className="text-xs uppercase tracking-[0.25em] text-white/60">{label}</span>
    </div>
  )
}
