"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getDrumKits, deleteDrumKit, type DrumKit } from "@/lib/dashboard-data"
import { Music, Plus, CheckCircle2, Clock, Trash2, Share2, Download, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PageHero } from "@/components/page-hero"

export default function MyKitsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [kits, setKits] = useState<DrumKit[]>([])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      setKits(getDrumKits())
    }
  }, [isAuthenticated])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading your kits...</p>
        </div>
      </div>
    )
  }

  const finishedKits = kits.filter((k) => k.status === "finished")
  const draftKits = kits.filter((k) => k.status === "draft")
  const totalSlices = kits.reduce((sum, k) => sum + k.sliceCount, 0)

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteDrumKit(id)
      setKits(kits.filter((k) => k.id !== id))
      toast({
        title: "Kit deleted",
        description: `${name} has been removed.`,
      })
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const getKitProgress = (kit: DrumKit) => {
    if (kit.status === "finished") return 100
    return Math.min(95, (kit.sliceCount / 16) * 100)
  }

  const heroStats = [
    { label: "Total kits", value: kits.length },
    { label: "Finished", value: finishedKits.length },
    { label: "In progress", value: draftKits.length },
    { label: "Slices", value: totalSlices },
  ]

  const renderKitGrid = (list: DrumKit[]) => {
    if (list.length === 0) {
      return (
        <div className="glass-panel border-dashed border-white/20 p-10 text-center text-white/70">
          <Music className="mx-auto mb-4 h-10 w-10 text-white/40" />
          <p>No kits yet. Start slicing to populate this view.</p>
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {list.map((kit) => (
          <div
            key={kit.id}
            className="space-y-5 rounded-[32px] border border-white/10 bg-black/35 p-5 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{kit.name}</p>
                <p className="text-sm text-white/60">{formatDate(kit.lastModified)}</p>
              </div>
              <Badge className="rounded-full bg-white/10 text-xs tracking-[0.35em]">
                {kit.status === "finished" ? (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-200">
                    <Clock className="h-3.5 w-3.5" />
                    Draft
                  </span>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.35em]">Slices</p>
                <p className="text-xl font-semibold text-white">{kit.sliceCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.35em]">Downloads</p>
                <p className="text-xl font-semibold text-white">{kit.downloads ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.35em]">Likes</p>
                <p className="text-xl font-semibold text-white">{kit.likes ?? 0}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Progress</span>
                <span className="font-medium text-white">{Math.round(getKitProgress(kit))}%</span>
              </div>
              <Progress value={getKitProgress(kit)} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110"
              >
                <Play className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 text-white hover:bg-white/10"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 text-white hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full border border-white/15 text-white/70 hover:text-white"
                onClick={() => handleDelete(kit.id, kit.name)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Library"
        title="My Drum Kits"
        description="Review finished drops, polish drafts, and keep every slice export-ready."
        actions={
          <Link href="/">
            <Button className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110">
              <Plus className="mr-2 h-4 w-4" />
              New kit session
            </Button>
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5/80 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">{stat.label}</p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <section className="glass-panel p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-full bg-white/5 p-1">
            <TabsTrigger
              value="all"
              className="rounded-full text-xs uppercase tracking-[0.35em] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black"
            >
              All ({kits.length})
            </TabsTrigger>
            <TabsTrigger
              value="finished"
              className="rounded-full text-xs uppercase tracking-[0.35em] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black"
            >
              Finished ({finishedKits.length})
            </TabsTrigger>
            <TabsTrigger
              value="drafts"
              className="rounded-full text-xs uppercase tracking-[0.35em] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black"
            >
              Drafts ({draftKits.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-8">
            {renderKitGrid(kits)}
          </TabsContent>
          <TabsContent value="finished" className="mt-8">
            {renderKitGrid(finishedKits)}
          </TabsContent>
          <TabsContent value="drafts" className="mt-8">
            {renderKitGrid(draftKits)}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
