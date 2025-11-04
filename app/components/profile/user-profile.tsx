"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Share2, UserPlus, Users } from "lucide-react"

// Mock user data
const mockUser = {
  id: "user123",
  username: "beatmaker99",
  name: "Alex Johnson",
  bio: "Producer and beat maker from Los Angeles. Specializing in trap and hip-hop drum kits.",
  avatarUrl: "/vibrant-street-market.png",
  followers: 1243,
  following: 352,
  memberSince: "Jan 2023",
  isPremium: true,
  stats: {
    uploads: 47,
    downloads: 12500,
    likes: 3200,
    comments: 840,
  },
}

// Mock drum kits data
const mockDrumKits = [
  {
    id: "kit1",
    name: "LA Trap Essentials",
    description: "Hard-hitting trap drums with punchy 808s",
    imageUrl: "/drum-kit-stage.png",
    price: 24.99,
    downloads: 3200,
    rating: 4.8,
    date: "2023-10-15",
  },
  {
    id: "kit2",
    name: "Lofi Chill Pack",
    description: "Warm, vintage drum samples perfect for lofi beats",
    imageUrl: "/dusty-beats.png",
    price: 19.99,
    downloads: 2100,
    rating: 4.9,
    date: "2023-08-22",
  },
  {
    id: "kit3",
    name: "Boom Bap Classics",
    description: "Classic hip-hop drums inspired by the 90s",
    imageUrl: "/boom-bap-beat.png",
    price: 0,
    downloads: 5400,
    rating: 4.7,
    date: "2023-06-10",
  },
]

export function UserProfile() {
  const [activeTab, setActiveTab] = useState("kits")
  const [isFollowing, setIsFollowing] = useState(false)

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={mockUser.avatarUrl || "/placeholder.svg"} alt={mockUser.name} />
              <AvatarFallback>{mockUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div>
                  <CardTitle className="text-2xl">{mockUser.name}</CardTitle>
                  <CardDescription className="text-base">@{mockUser.username}</CardDescription>
                </div>

                {mockUser.isPremium && (
                  <Badge variant="secondary" className="self-center md:self-start">
                    Premium Creator
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-muted-foreground">{mockUser.bio}</p>

              <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                <div className="text-center">
                  <p className="font-bold">{mockUser.followers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{mockUser.following.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{mockUser.stats.uploads}</p>
                  <p className="text-xs text-muted-foreground">Kits</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{mockUser.stats.downloads.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant={isFollowing ? "outline" : "default"}
                className="w-full"
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="kits">Drum Kits</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="kits">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockDrumKits.map((kit) => (
                  <DrumKitCard key={kit.id} kit={kit} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="samples">
              <div className="text-center py-8 text-muted-foreground">
                <p>Individual samples will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-center py-8 text-muted-foreground">
                <p>User activity feed will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">Member since {mockUser.memberSince}</CardFooter>
      </Card>
    </div>
  )
}

function DrumKitCard({ kit }: { kit: (typeof mockDrumKits)[0] }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img src={kit.imageUrl || "/placeholder.svg"} alt={kit.name} className="object-cover w-full h-full" />
        {kit.price === 0 ? (
          <Badge className="absolute top-2 right-2 bg-green-500">Free</Badge>
        ) : (
          <Badge className="absolute top-2 right-2">${kit.price}</Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{kit.name}</CardTitle>
        <CardDescription>{kit.description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-0 flex justify-between">
        <div className="text-sm text-muted-foreground">
          {new Date(kit.date).toLocaleDateString()} • {kit.downloads.toLocaleString()} downloads
        </div>
        <div className="flex items-center">
          <span className="text-amber-500 mr-1">★</span>
          <span>{kit.rating}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
