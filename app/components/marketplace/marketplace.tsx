"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ShoppingCart, Play, ArrowLeft, ArrowRight } from "lucide-react"

type Kit = {
  id: string
  title: string
  creator: string
  artwork: string
  price: number
  genre: string
  bpm: number
  key: string
  tags: string[]
  description: string
}

const kitSections: Record<
  "trending" | "drum" | "oneShots",
  { title: string; description: string; kits: Kit[]; pill: string }
> = {
  trending: {
    title: "Trending Kits",
    pill: "What producers are slicing right now",
    description: "Curated drops from the hottest creators this week.",
    kits: [
      {
        id: "trend-1",
        title: "Chrome Sunrise",
        creator: "Serge Lumiere",
        artwork: "https://images.unsplash.com/photo-1526218626217-dc65d44b4054?auto=format&fit=crop&w=600&q=80",
        price: 24,
        genre: "K-pop · Synthwave",
        bpm: 126,
        key: "E♭m",
        tags: ["glass", "synth", "claps"],
        description: "Neon claps, chrome snaps, and sunrise subs inspired by Seoul club energy.",
      },
      {
        id: "trend-2",
        title: "Momentum 808s",
        creator: "M.C.A",
        artwork: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=600&q=80",
        price: 29,
        genre: "Crunk · R&B",
        bpm: 140,
        key: "C",
        tags: ["808", "vox", "subs"],
        description: "Crunk subs, vocal chops, and stadium-ready tom rolls.",
      },
      {
        id: "trend-3",
        title: "Alice Dolls FX",
        creator: "Mr. Mellow",
        artwork: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
        price: 0,
        genre: "EDM · Bouncy",
        bpm: 128,
        key: "G",
        tags: ["fx", "risers", "fills"],
        description: "Bouncy risers, candy-coated sweeps, and FX layers ready for your drops.",
      },
      {
        id: "trend-4",
        title: "Call Me Babe Vox Cuts",
        creator: "Alex Curly",
        artwork: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
        price: 18,
        genre: "Pop · Honey",
        bpm: 122,
        key: "A",
        tags: ["vox", "airy", "phrases"],
        description: "Honeyed pop stacks, airy breaths, and conversational vox chops.",
      },
    ],
  },
  drum: {
    title: "Drum Kits",
    pill: "Hard-hitting foundations",
    description: "Full kits with tops, subs, and percussion beds.",
    kits: [
      {
        id: "drum-1",
        title: "Dust Theory",
        creator: "Hasenchat Music",
        artwork: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
        price: 32,
        genre: "UKG · Perc Glue",
        bpm: 132,
        key: "F#",
        tags: ["percussion", "swing"],
        description: "Gritty tops, syncopated hats, and saturated kicks for UKG sets.",
      },
      {
        id: "drum-2",
        title: "Glitch Hats",
        creator: "Chibitaii",
        artwork: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
        price: 22,
        genre: "Glitch · Hats",
        bpm: 150,
        key: "D",
        tags: ["hats", "glitch", "tops"],
        description: "Binary hat loops, sharded glitches, and swing-ready sticks.",
      },
      {
        id: "drum-3",
        title: "DnB Stabs",
        creator: "Sky @ Ramblebots",
        artwork: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80",
        price: 27,
        genre: "DnB",
        bpm: 172,
        key: "B",
        tags: ["breaks", "stabs"],
        description: "Surgical snares, Reese stabs, and velocity-layered breaks.",
      },
      {
        id: "drum-4",
        title: "Hyperpop Vox One-Shots",
        creator: "Lucilius",
        artwork: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
        price: 19,
        genre: "Hyperpop",
        bpm: 160,
        key: "C#",
        tags: ["vox", "one-shot"],
        description: "Pitch-bent vox stabs, glitched breaths, and vocoder-ready chops.",
      },
    ],
  },
  oneShots: {
    title: "One Shots & Instruments",
    pill: "Hooks in one click",
    description: "Keys, bass, and melodic hits for instant hooks.",
    kits: [
      {
        id: "one-1",
        title: "Vapor Keys",
        creator: "Kali Flux",
        artwork: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80",
        price: 21,
        genre: "Synthwave",
        bpm: 118,
        key: "Cm",
        tags: ["keys", "synth"],
        description: "Analog pads, DX keys, and dreamy synth stabs for retro lines.",
      },
      {
        id: "one-2",
        title: "Bass Punch Vol.2",
        creator: "Nova Reese",
        artwork: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
        price: 17,
        genre: "Trap · Bass",
        bpm: 142,
        key: "G",
        tags: ["bass", "one-shot"],
        description: "Sub punches, FM growls, and 808 tail shots tuned to perfection.",
      },
      {
        id: "one-3",
        title: "Vox Sparks",
        creator: "Mei Rivera",
        artwork: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
        price: 0,
        genre: "Pop · Vox",
        bpm: 125,
        key: "A",
        tags: ["vox", "free"],
        description: "Creative commons vox sparks and phrases for your next hook.",
      },
      {
        id: "one-4",
        title: "Analog Dust",
        creator: "Dust Theory",
        artwork: "https://images.unsplash.com/photo-1454922915609-78549ad709bb?auto=format&fit=crop&w=600&q=80",
        price: 23,
        genre: "Lo-fi",
        bpm: 92,
        key: "E♭",
        tags: ["one-shot", "lofi"],
        description: "Vinyl one-shots, chord hits, and dusty textures straight from tape.",
      },
    ],
  },
}

export function Marketplace() {
  const [query, setQuery] = useState("")
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null)
  const [viewAllSection, setViewAllSection] = useState<keyof typeof kitSections | null>(null)

  const filteredSections = useMemo(() => {
    if (!query) return kitSections
    const needle = query.toLowerCase()
    const filterKits = (kits: Kit[]) =>
      kits.filter(
        (kit) =>
          kit.title.toLowerCase().includes(needle) ||
          kit.creator.toLowerCase().includes(needle) ||
          kit.genre.toLowerCase().includes(needle) ||
          kit.tags.some((tag) => tag.toLowerCase().includes(needle)),
      )
    return {
      trending: { ...kitSections.trending, kits: filterKits(kitSections.trending.kits) },
      drum: { ...kitSections.drum, kits: filterKits(kitSections.drum.kits) },
      oneShots: { ...kitSections.oneShots, kits: filterKits(kitSections.oneShots.kits) },
    }
  }, [query])

  const carousels: Array<keyof typeof kitSections> = ["trending", "drum", "oneShots"]

  const Carousel = ({ sectionKey }: { sectionKey: keyof typeof kitSections }) => {
    const section = filteredSections[sectionKey]
    const scrollRef = useRef<HTMLDivElement>(null)
    const scrollBy = (direction: "left" | "right") => {
      if (!scrollRef.current) return
      const amount = direction === "left" ? -360 : 360
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" })
    }

    if (section.kits.length === 0) return null

    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">{section.pill}</p>
            <h2 className="font-display text-2xl text-white">{section.title}</h2>
            <p className="text-sm text-white/70">{section.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full border border-white/10 text-white/70 hover:text-white" onClick={() => scrollBy("left")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full border border-white/10 text-white/70 hover:text-white" onClick={() => scrollBy("right")}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="rounded-full text-white/80 hover:text-white" onClick={() => setViewAllSection(sectionKey)}>
              View all
            </Button>
          </div>
        </div>
        <div ref={scrollRef} className="carousel flex gap-4 overflow-x-auto pb-2">
          {section.kits.map((kit) => (
            <button
              key={kit.id}
              className="min-w-[260px] flex-1 rounded-3xl border border-white/10 bg-white/5 text-left text-white shadow-[0_20px_60px_rgba(5,2,12,0.65)] transition hover:scale-[1.01]"
              onClick={() => setSelectedKit(kit)}
            >
              <div className="relative h-48 overflow-hidden rounded-3xl bg-black/30">
                <Image src={kit.artwork} alt={kit.title} fill className="object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  {kit.price === 0 ? (
                    <Badge className="rounded-full bg-emerald-400/90 text-emerald-950">Free</Badge>
                  ) : (
                    <Badge className="rounded-full bg-white/90 text-black">${kit.price}</Badge>
                  )}
                  <Badge className="rounded-full border border-white/40 bg-white/10 text-white/90">{kit.genre}</Badge>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{kit.creator}</p>
                <h3 className="text-lg font-semibold">{kit.title}</h3>
                <p className="text-sm text-white/60">{kit.description}</p>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span>{kit.bpm} BPM</span>
                  <span>Key {kit.key}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-white/70">
                  {kit.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="px-4 py-10 md:px-12 lg:px-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Marketplace</p>
          <h1 className="font-display text-4xl text-white">Community Kits</h1>
          <p className="max-w-xl text-white/70">Browse four-up glass carousels and tap into trending drops across DrumKitzz.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search kits or creators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 border-white/20 bg-white/5 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      <Tabs defaultValue="kits" className="space-y-8">
        <TabsList className="bg-white/5 text-white">
          <TabsTrigger value="kits">Kits</TabsTrigger>
          <TabsTrigger value="curators">Curators</TabsTrigger>
        </TabsList>
        <TabsContent value="kits" className="space-y-12">
          {carousels.map((section) => (
            <Carousel key={section} sectionKey={section} />
          ))}
        </TabsContent>
        <TabsContent value="curators">
          <Card className="rounded-3xl border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-3 p-6">
              <p className="text-sm text-white/60">
                Curator lists return soon. For now, browse kits in Trending, Drum Kits, and One Shot sections.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedKit} onOpenChange={() => setSelectedKit(null)}>
        {selectedKit && (
          <DialogContent className="max-w-4xl border border-white/10 bg-[#07040d] text-white">
            <DialogHeader>
              <DialogTitle>{selectedKit.title}</DialogTitle>
              <DialogDescription className="text-white/60">by {selectedKit.creator}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="relative h-72 flex-1 overflow-hidden rounded-3xl">
                <Image src={selectedKit.artwork} alt={selectedKit.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <button className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/10 p-2">
                  <Play className="h-4 w-4" />
                </button>
              </div>
              <div className="w-full flex-1 space-y-4">
                <p className="text-white/80">{selectedKit.description}</p>
                <div className="flex flex-wrap gap-3 text-sm text-white/60">
                  <span>{selectedKit.genre}</span>
                  <span>{selectedKit.bpm} BPM</span>
                  <span>Key {selectedKit.key}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedKit.tags.map((tag) => (
                    <Badge key={tag} className="rounded-full border border-white/20 bg-white/10 text-white/80">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-3xl font-semibold">
                    {selectedKit.price === 0 ? "Free download" : `$${selectedKit.price}`}
                  </p>
                  <div className="flex gap-3">
                    <Button className="rounded-full bg-white text-black hover:bg-white/80">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {selectedKit.price === 0 ? "Download" : "Buy kit"}
                    </Button>
                    <Button variant="ghost" className="rounded-full border border-white/20 text-white/80 hover:bg-white/5">
                      <Heart className="mr-2 h-4 w-4" />
                      Favorite
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!viewAllSection} onOpenChange={() => setViewAllSection(null)}>
        {viewAllSection && (
          <DialogContent className="max-w-5xl border border-white/10 bg-[#07040d] text-white">
            <DialogHeader>
              <DialogTitle>{kitSections[viewAllSection].title}</DialogTitle>
              <DialogDescription className="text-white/60">{kitSections[viewAllSection].description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              {kitSections[viewAllSection].kits.map((kit) => (
                <div
                  key={kit.id}
                  className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                  onClick={() => {
                    setSelectedKit(kit)
                    setViewAllSection(null)
                  }}
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                    <Image src={kit.artwork} alt={kit.title} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">{kit.creator}</p>
                    <p className="text-lg font-semibold">{kit.title}</p>
                    <p className="text-xs text-white/60">{kit.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
