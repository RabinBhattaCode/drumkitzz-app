"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Play } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { AuthForms } from "@/app/components/auth/auth-forms"

const suggestedCreators = [
  {
    id: "c1",
    name: "Dust Theory",
    handle: "@hasenchat",
    followers: "30K",
    genre: "UKG · Perc Glue",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "c2",
    name: "Chibitaii",
    handle: "@chibitaii",
    followers: "15K",
    genre: "Glitch Hats",
    avatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "c3",
    name: "Sky @ Ramblebots",
    handle: "@ramblebots",
    followers: "5.8K",
    genre: "DnB Stabs",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "c4",
    name: "Lucilius",
    handle: "@lucilius",
    followers: "6.6K",
    genre: "Hyperpop Vox One-Shots",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
]

const trendingMoments = [
  {
    id: "t1",
    title: "Chrome Sunrise Kit",
    creator: "Serge Lumiere",
    mood: "K-pop shakers · neon claps",
    stats: { plays: "5.8K", likes: 525, comments: 61 },
    artwork: "https://images.unsplash.com/photo-1526218626217-dc65d44b4054?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "t2",
    title: "Momentum 808s",
    creator: "M.C.A",
    mood: "Crunk subs · vocal chops",
    stats: { plays: "4.3K", likes: 274, comments: 22 },
    artwork: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "t3",
    title: "Alice Dolls FX",
    creator: "Mr. Mellow",
    mood: "EDM risers · bouncy rims",
    stats: { plays: "17K", likes: 330, comments: 40 },
    artwork: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "t4",
    title: "Call Me Babe Vox Cuts",
    creator: "Alex Curly",
    mood: "Pop stacks · airy breaths",
    stats: { plays: "3.0K", likes: 360, comments: 48 },
    artwork: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
  },
]

const notifications = [
  { id: "n1", text: "ShadowLab sampled your kit “Juniper Dust”", time: "Just now" },
  { id: "n2", text: "3 new producers downloaded “Velvet Perc Pack”", time: "1h ago" },
  { id: "n3", text: "Sky @ramblebots followed your Kit Forge profile", time: "2h ago" },
]

export default function HomePage() {
  const [trendScope, setTrendScope] = useState("global")
  const [trendWindow, setTrendWindow] = useState("now")
  const [showSignup, setShowSignup] = useState(false)
  const { isAuthenticated } = useAuth()
  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("signup") === "true") {
        setShowSignup(true)
      }
    }
  }, [isAuthenticated])

  const renderHero = () => {
    if (isAuthenticated) {
      return (
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#04060f] via-[#0b0e1c] to-[#050505] p-8 shadow-[0_35px_100px_rgba(0,0,0,0.6)]">
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <Badge className="bg-white/10 text-white">Welcome back</Badge>
              <h1 className="text-4xl font-semibold text-white">Dashboard</h1>
              <p className="text-white/70">Stay on top of your kits, sales, and following feed.</p>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "My Kits", value: "24" },
                  { label: "Last 30d Sales", value: "$1.9K" },
                  { label: "Following feed", value: "12 updates" },
                ].map((item) => (
                  <Card key={item.label} className="border-white/10 bg-white/5 text-white">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">Following feed</h2>
                {notifications.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-white/80">{note.text}</p>
                    <p className="text-xs text-white/50">{note.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      )
    }

    return (
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#050505] via-[#0c0d12] to-[#15161c] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#f5d97a]/22 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#2f313a]/30 blur-[140px]" />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6 text-left">
            <Badge className="w-fit bg-white/15 text-white">Community for beatmakers</Badge>
            <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
              Build the drum kits creating the sound of tomorrow.
            </h1>
            <p className="text-lg text-white/70 md:text-xl">
              Drag stems, resample vinyl, or rip your favourite playlist. DrumKitzz trims, processes, and packages kits,
              one-shots, and percussion stacks so producers can craft tomorrow’s sonics without losing time to manual edits.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/15 bg-white/5/10 p-6 backdrop-blur">
                <p className="text-sm text-white/70">Hey there, create an account to get started!</p>
                <Link href="/signup">
                  <Button className="mt-3 w-full rounded-full bg-amber-400 text-black hover:bg-amber-300">Create an account</Button>
                </Link>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-gradient-to-r from-[#f5d97a]/20 to-[#b37a09]/10 p-6">
                <p className="text-sm text-white/70">Already inspired? Jump into the kit builder.</p>
                <Link href="/create">
                  <Button className="mt-3 rounded-full bg-gradient-to-r from-[#f5d97a] to-[#b37a09] text-black hover:brightness-110">
                    Create your kit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <Image
              src="https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png?updatedAt=1763080146104"
              alt="Producers sculpting drum kits"
              width={520}
              height={520}
              className="w-full max-w-md rounded-[32px] border border-white/10 object-cover shadow-[0_35px_100px_rgba(0,0,0,0.65)]"
              priority
            />
          </div>
        </div>
      </section>
    )
  }
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      {renderHero()}

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Suggested Kit Architects</h2>
            {!isAuthenticated && (
              <Button variant="ghost" className="text-white/70 hover:text-white">
                View all
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestedCreators.map((creator) => (
              <Card key={creator.id} className="border-white/10 bg-white/5 text-white shadow-lg">
                <CardContent className="flex items-center gap-4 p-4">
                  <Image
                    src={creator.avatar}
                    alt={creator.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{creator.name}</p>
                    <p className="text-sm text-white/60">{creator.handle}</p>
                    <p className="text-xs text-white/40">{creator.genre}</p>
                  </div>
                  <Button size="sm" className="rounded-full bg-white/15 text-white hover:bg-white/25">
                    Follow
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5 text-white shadow-xl">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-white/60">
            <Bell className="h-4 w-4" /> Release Radar
          </div>
          <div className="space-y-4">
            {notifications.map((note) => (
              <div key={note.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/80">{note.text}</p>
                <p className="text-xs text-white/50">{note.time}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-6" id="trending-kits">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Trending Kits</p>
            <h2 className="text-xl font-semibold text-white">What producers are chopping right now</h2>
          </div>
          <Tabs value={trendScope} onValueChange={setTrendScope} className="rounded-full border border-white/10">
            <TabsList className="bg-transparent">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="local">Local</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={trendWindow} onValueChange={setTrendWindow} className="rounded-full border border-white/10">
            <TabsList className="bg-transparent">
              <TabsTrigger value="now">Now</TabsTrigger>
              <TabsTrigger value="week">This week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {trendingMoments.map((moment) => (
            <Card
              key={moment.id}
              className="flex items-center gap-4 border-white/10 bg-white/5 p-4 text-white shadow-[0_20px_60px_rgba(5,2,12,0.65)]"
            >
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl">
                <Image src={moment.artwork} alt={moment.title} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Badge className="bg-white/15 text-white">
                    {trendScope === "global" ? "Global" : "Local"}
                  </Badge>
                  <Badge className="bg-black/40 text-white">
                    {trendWindow === "now" ? "Now" : "This week"}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold">{moment.title}</h3>
                <p className="text-sm text-white/60">{moment.creator}</p>
                <p className="text-xs text-white/50">{moment.mood}</p>
                <div className="flex flex-wrap gap-4 text-xs text-white/60">
                  <span>▶ {moment.stats.plays}</span>
                  <span>❤ {moment.stats.likes}</span>
                  <span>💬 {moment.stats.comments}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full border border-white/20 text-white hover:bg-white/10">
                <Play className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </section>
      {!isAuthenticated && (
        <section className="rounded-[32px] border border-white/10 bg-black/20 p-4 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <Image
            src="https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png?updatedAt=1763080146104"
            alt="Kit preview"
            width={1200}
            height={700}
            className="mx-auto w-full max-w-3xl rounded-[28px]"
          />
        </section>
      )}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="max-w-md border border-white/10 bg-gradient-to-br from-[#0d0c18] via-[#090712] to-[#040308]">
          <AuthForms initialTab="signup" onSuccess={() => setShowSignup(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
