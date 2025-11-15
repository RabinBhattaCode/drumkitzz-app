"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, Star, Heart, TrendingUp, Users } from "lucide-react"
import { PageHero } from "@/components/page-hero"

const TOP_CREATORS = [
  {
    id: "creator1",
    name: "DrumMaster",
    avatar: "/vibrant-street-market.png",
    followers: 12500,
    kits: 47,
    downloads: 156000,
    isFollowing: false,
  },
  {
    id: "creator2",
    name: "BeatSmith",
    avatar: "/drum-kit-stage.png",
    followers: 9800,
    kits: 32,
    downloads: 124000,
    isFollowing: true,
  },
  {
    id: "creator3",
    name: "RhythmQueen",
    avatar: "/dusty-beats.png",
    followers: 8700,
    kits: 28,
    downloads: 98000,
    isFollowing: false,
  },
  {
    id: "creator4",
    name: "LoopLegend",
    avatar: "/boom-bap-beat.png",
    followers: 7500,
    kits: 25,
    downloads: 85000,
    isFollowing: false,
  },
  {
    id: "creator5",
    name: "SampleKing",
    avatar: "/vibrant-city-market.png",
    followers: 6200,
    kits: 19,
    downloads: 72000,
    isFollowing: true,
  },
]

const TOP_KITS = [
  {
    id: "kit1",
    name: "Boom Bap Essentials",
    creator: "DrumMaster",
    image: "/boom-bap-beat.png",
    downloads: 24500,
    rating: 4.9,
    price: 24.99,
    isLiked: true,
  },
  {
    id: "kit2",
    name: "Trap Universe",
    creator: "BeatSmith",
    image: "/vibrant-street-market.png",
    downloads: 19800,
    rating: 4.8,
    price: 29.99,
    isLiked: false,
  },
  {
    id: "kit3",
    name: "Lo-Fi Dreams",
    creator: "RhythmQueen",
    image: "/dusty-beats.png",
    downloads: 18200,
    rating: 4.7,
    price: 19.99,
    isLiked: false,
  },
  {
    id: "kit4",
    name: "House Fundamentals",
    creator: "LoopLegend",
    image: "/drum-kit-stage.png",
    downloads: 15600,
    rating: 4.6,
    price: 34.99,
    isLiked: true,
  },
  {
    id: "kit5",
    name: "Drill Dominance",
    creator: "SampleKing",
    image: "/vibrant-city-market.png",
    downloads: 14300,
    rating: 4.5,
    price: 27.99,
    isLiked: false,
  },
]

export default function ChartsPage() {
  const [creators, setCreators] = useState(TOP_CREATORS)
  const [kits, setKits] = useState(TOP_KITS)

  const handleFollowCreator = (creatorId: string) => {
    setCreators((prev) =>
      prev.map((creator) =>
        creator.id === creatorId
          ? {
              ...creator,
              isFollowing: !creator.isFollowing,
              followers: creator.isFollowing ? creator.followers - 1 : creator.followers + 1,
            }
          : creator,
      ),
    )
  }

  const handleLikeKit = (kitId: string) => {
    setKits((prev) => prev.map((kit) => (kit.id === kitId ? { ...kit, isLiked: !kit.isLiked } : kit)))
  }

  return (
    <div className="w-full max-w-6xl space-y-8 px-4 py-10 lg:px-0">
      <PageHero
        eyebrow="Marketplace"
        title="Trending charts"
        description="Track the creators, kits, and genres shaping the DrumKitzz economy."
      />

      <Tabs defaultValue="creators" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 rounded-full bg-white/5 p-1">
          <TabsTrigger
            value="creators"
            className="rounded-full text-xs uppercase tracking-[0.35em] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black"
          >
            Top creators
          </TabsTrigger>
          <TabsTrigger
            value="kits"
            className="rounded-full text-xs uppercase tracking-[0.35em] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d97a] data-[state=active]:to-[#f0b942] data-[state=active]:text-black"
          >
            Top kits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="space-y-4">
          {creators.map((creator, index) => (
            <div
              key={creator.id}
              className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-black/30 p-4 text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
            >
              <div className="text-2xl font-bold text-white/30">#{index + 1}</div>
              <Avatar className="h-12 w-12">
                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                <AvatarFallback>{creator.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-lg font-semibold">{creator.name}</p>
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {creator.followers.toLocaleString()} followers
                  </span>
                  <span>{creator.kits} kits</span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {creator.downloads.toLocaleString()} downloads
                  </span>
                </div>
              </div>
              <Button
                variant={creator.isFollowing ? "secondary" : "ghost"}
                className="rounded-full border border-white/15 text-white hover:bg-white/10"
                onClick={() => handleFollowCreator(creator.id)}
              >
                {creator.isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="kits">
          <div className="grid gap-6 md:grid-cols-2">
            {kits.map((kit, index) => (
              <div
                key={kit.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#090712] to-[#050308] text-white shadow-[0_25px_80px_rgba(5,5,7,0.65)]"
              >
                <div className="relative h-44 w-full">
                  <Image src={kit.image || "/placeholder.svg"} alt={kit.name} fill className="object-cover" />
                  <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold">
                    #{index + 1}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{kit.name}</p>
                      <p className="text-sm text-white/60">by {kit.creator}</p>
                    </div>
                    <div className="rounded-full border border-white/15 px-3 py-1 text-sm">${kit.price.toFixed(2)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {kit.downloads.toLocaleString()} downloads
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {kit.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110"
                    >
                      Purchase
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full border border-white/15 text-white/70 hover:text-white"
                      onClick={() => handleLikeKit(kit.id)}
                    >
                      <Heart className={`mr-2 h-4 w-4 ${kit.isLiked ? "fill-current text-rose-300" : ""}`} />
                      {kit.isLiked ? "Liked" : "Like"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
