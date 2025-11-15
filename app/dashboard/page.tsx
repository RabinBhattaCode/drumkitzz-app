"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  getDrumKits,
  getFriends,
  getActivities,
  deleteDrumKit,
  type DrumKit,
  type Friend,
  type Activity,
} from "@/lib/dashboard-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHero } from "@/components/page-hero"
import {
  Music,
  CheckCircle2,
  FileEdit,
  Users,
  Plus,
  Trash2,
  Share2,
  Heart,
  Download,
} from "lucide-react"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [kits, setKits] = useState<DrumKit[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      setKits(getDrumKits())
      setFriends(getFriends())
      setActivities(getActivities())
    }
  }, [isAuthenticated])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const finishedKits = kits.filter((k) => k.status === "finished")
  const draftKits = kits.filter((k) => k.status === "draft")

  const heroStats = [
      { label: "Total kits", value: kits.length.toString(), helper: "All projects", icon: Music },
      { label: "Finished", value: finishedKits.length.toString(), helper: "Ready to share", icon: CheckCircle2 },
      { label: "In progress", value: draftKits.length.toString(), helper: "Active drafts", icon: FileEdit },
      { label: "Friends", value: friends.length.toString(), helper: "Connected creators", icon: Users },
    ]

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this drum kit?")) {
      deleteDrumKit(id)
      setKits(kits.filter((k) => k.id !== id))
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

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return <Plus className="h-4 w-4" />
      case "exported":
        return <Download className="h-4 w-4" />
      case "shared":
        return <Share2 className="h-4 w-4" />
      case "liked":
        return <Heart className="h-4 w-4" />
    }
  }

  const getActivityText = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return "Created"
      case "exported":
        return "Exported"
      case "shared":
        return "Shared"
      case "liked":
        return "Liked"
    }
  }

  const renderKitGrid = (list: DrumKit[]) => {
    if (list.length === 0) {
      return (
        <div className="glass-panel border-dashed border-white/20 p-10 text-center text-white/70">
          <Music className="mx-auto mb-4 h-10 w-10 text-white/40" />
          <p>No kits in this view yet.</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((kit) => (
          <div
            key={kit.id}
            className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0a070f] to-[#050308] text-white shadow-[0_18px_60px_rgba(3,3,7,0.55)]"
          >
            <div className="relative aspect-video">
              <img src={kit.thumbnail || "/placeholder.svg"} alt={kit.name} className="h-full w-full object-cover" />
              <Badge
                className="absolute right-3 top-3 rounded-full bg-black/60 text-xs uppercase tracking-[0.3em]"
                variant={kit.status === "finished" ? "default" : "secondary"}
              >
                {kit.status === "finished" ? "Finished" : "Draft"}
              </Badge>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{kit.name}</p>
                  <p className="text-sm text-white/60">{formatDate(kit.lastModified)}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">{kit.sliceCount} slices</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110"
                  onClick={() => router.push("/my-library")}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full border border-white/15 text-white/80 hover:text-white"
                  onClick={() => handleDelete(kit.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Creator HQ"
        title={`Welcome back, ${user?.username}!`}
        description="Keep your drum kits, drafts, and community updates in one sleek workspace."
        actions={
          <>
            <Button
              className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110"
              onClick={() => router.push("/")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new kit
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-white/30 text-white hover:bg-white/10"
              onClick={() => router.push("/marketplace")}
            >
              Explore marketplace
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5/80 px-4 py-3 text-white/80 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.helper}</p>
                </div>
                <stat.icon className="h-5 w-5 text-white/50" />
              </div>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-[1.8fr,0.9fr]">
        <div className="space-y-6">
          <section className="glass-panel space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Library</p>
                <h2 className="font-display text-2xl text-white">My Drum Kits</h2>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-white/30 text-white hover:bg-white/10"
                onClick={() => router.push("/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Start slicing
              </Button>
            </div>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-white/5 p-1">
                <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black">
                  All ({kits.length})
                </TabsTrigger>
                <TabsTrigger value="finished" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black">
                  Finished ({finishedKits.length})
                </TabsTrigger>
                <TabsTrigger value="drafts" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black">
                  Drafts ({draftKits.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {renderKitGrid(kits)}
              </TabsContent>
              <TabsContent value="finished" className="mt-6">
                {renderKitGrid(finishedKits)}
              </TabsContent>
              <TabsContent value="drafts" className="mt-6">
                {renderKitGrid(draftKits)}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="glass-panel space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Social</p>
                <h3 className="font-display text-xl">Friends online</h3>
              </div>
              <Badge className="rounded-full bg-white/10 text-xs text-white">Live</Badge>
            </div>
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{friend.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-white">{friend.username}</p>
                      <p className="text-xs text-white/60">{friend.bio}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={friend.isFollowing ? "secondary" : "ghost"}
                    className="rounded-full border border-white/15 text-white hover:bg-white/10"
                  >
                    {friend.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Timeline</p>
                <h3 className="font-display text-xl">Recent activity</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full border border-white/15 text-white/70 hover:bg-white/10"
                onClick={() => setActivities([])}
              >
                Clear
              </Button>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      {getActivityText(activity.type)} <span className="font-semibold">{activity.kitName}</span>
                    </p>
                    <p className="text-xs text-white/60">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
