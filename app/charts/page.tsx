"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, Star, Heart, TrendingUp, Users } from "lucide-react"

// Mock data for top creators
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

// Mock data for top kits
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
    setCreators(
      creators.map((creator) =>
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
    setKits(kits.map((kit) => (kit.id === kitId ? { ...kit, isLiked: !kit.isLiked } : kit)))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Charts</h1>

      <Tabs defaultValue="creators">
        <TabsList className="mb-6">
          <TabsTrigger value="creators">Top Creators</TabsTrigger>
          <TabsTrigger value="kits">Top Kits</TabsTrigger>
        </TabsList>

        <TabsContent value="creators">
          <div className="space-y-4">
            {creators.map((creator, index) => (
              <Card key={creator.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-xl text-muted-foreground w-8 text-center">#{index + 1}</div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={creator.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold">{creator.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {creator.followers.toLocaleString()}
                        </div>
                        <div>{creator.kits} kits</div>
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          {creator.downloads.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={creator.isFollowing ? "outline" : "default"}
                      onClick={() => handleFollowCreator(creator.id)}
                    >
                      {creator.isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kits">
          <div className="grid md:grid-cols-2 gap-6">
            {kits.map((kit, index) => (
              <Card key={kit.id}>
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="relative h-32 w-32">
                      <Image src={kit.image || "/placeholder.svg"} alt={kit.name} fill className="object-cover" />
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm font-bold">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold">{kit.name}</h3>
                          <p className="text-sm text-muted-foreground">by {kit.creator}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleLikeKit(kit.id)}>
                          <Heart className={`h-5 w-5 ${kit.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          {kit.downloads.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {kit.rating}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Trending
                        </div>
                      </div>
                      <div className="mt-2 font-bold">${kit.price}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
