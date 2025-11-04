"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus, Trophy, Download, Heart, Star } from "lucide-react"

// Mock leaderboard data
const mockLeaderboardData = {
  topCreators: [
    {
      id: "user1",
      username: "beatmaker99",
      name: "Alex Johnson",
      avatarUrl: "/vibrant-city-market.png",
      isPremium: true,
      stats: { uploads: 47, downloads: 12500, followers: 1243 },
    },
    {
      id: "user2",
      username: "drumgod",
      name: "Sarah Williams",
      avatarUrl: "/placeholder.svg?height=50&width=50&query=user2",
      isPremium: true,
      stats: { uploads: 32, downloads: 9800, followers: 987 },
    },
    {
      id: "user3",
      username: "rhythmmaster",
      name: "Mike Chen",
      avatarUrl: "/placeholder.svg?height=50&width=50&query=user3",
      isPremium: false,
      stats: { uploads: 28, downloads: 8200, followers: 754 },
    },
    {
      id: "user4",
      username: "beatsmith",
      name: "Taylor Rodriguez",
      avatarUrl: "/placeholder.svg?height=50&width=50&query=user4",
      isPremium: false,
      stats: { uploads: 23, downloads: 6100, followers: 612 },
    },
    {
      id: "user5",
      username: "sampleking",
      name: "Jordan Lee",
      avatarUrl: "/placeholder.svg?height=50&width=50&query=user5",
      isPremium: true,
      stats: { uploads: 19, downloads: 5400, followers: 521 },
    },
  ],
  topKits: [
    {
      id: "kit1",
      name: "LA Trap Essentials",
      creatorName: "Alex Johnson",
      creatorUsername: "beatmaker99",
      downloads: 3200,
      likes: 1450,
      rating: 4.8,
    },
    {
      id: "kit2",
      name: "Future Bass Pack",
      creatorName: "Sarah Williams",
      creatorUsername: "drumgod",
      downloads: 2800,
      likes: 1320,
      rating: 4.9,
    },
    {
      id: "kit3",
      name: "Boom Bap Classics",
      creatorName: "Mike Chen",
      creatorUsername: "rhythmmaster",
      downloads: 2600,
      likes: 1180,
      rating: 4.7,
    },
    {
      id: "kit4",
      name: "Lofi Chill Pack",
      creatorName: "Taylor Rodriguez",
      creatorUsername: "beatsmith",
      downloads: 2100,
      likes: 980,
      rating: 4.6,
    },
    {
      id: "kit5",
      name: "EDM Essentials",
      creatorName: "Jordan Lee",
      creatorUsername: "sampleking",
      downloads: 1900,
      likes: 870,
      rating: 4.5,
    },
  ],
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState("creators")
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({})

  const toggleFollow = (userId: string) => {
    setFollowingState((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-amber-500" />
          DrumKitzz Leaderboard
        </CardTitle>
        <CardDescription>Top creators and drum kits in the community</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="creators">Top Creators</TabsTrigger>
            <TabsTrigger value="kits">Top Kits</TabsTrigger>
          </TabsList>

          <TabsContent value="creators">
            <div className="space-y-4">
              {mockLeaderboardData.topCreators.map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>

                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={creator.avatarUrl || "/placeholder.svg"} alt={creator.name} />
                      <AvatarFallback>{creator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{creator.name}</p>
                        {creator.isPremium && (
                          <Badge variant="secondary" className="text-xs">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-medium">{creator.stats.uploads}</p>
                        <p className="text-xs text-muted-foreground">Kits</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{creator.stats.downloads.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Downloads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{creator.stats.followers.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                    </div>

                    <Button
                      variant={followingState[creator.id] ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleFollow(creator.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {followingState[creator.id] ? "Following" : "Follow"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="kits">
            <div className="space-y-4">
              {mockLeaderboardData.topKits.map((kit, index) => (
                <div key={kit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-medium">{kit.name}</p>
                      <p className="text-sm text-muted-foreground">by @{kit.creatorUsername}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>{kit.downloads.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span>{kit.likes.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>{kit.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
