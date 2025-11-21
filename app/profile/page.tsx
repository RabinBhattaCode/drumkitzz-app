"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getKits } from "@/lib/dashboard-data"
import { Music, Download, Heart, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [kits, setKits] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("kits")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    } else if (isAuthenticated) {
      setKits(getKits())
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
    totalDownloads: kits.reduce((sum, kit) => sum + (kit.downloads || 0), 0),
    totalLikes: kits.reduce((sum, kit) => sum + (kit.likes || 0), 0),
    totalComments: 42, // Mock data
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
              <AvatarFallback className="text-2xl">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div>
                  <CardTitle className="text-3xl">{user.username}</CardTitle>
                  <CardDescription className="text-base">{user.email}</CardDescription>
                </div>
                <Badge variant="secondary" className="self-center md:self-start">
                  Creator
                </Badge>
              </div>

              <p className="mt-3 text-muted-foreground">
                Music producer and drum kit creator. Crafting unique sounds for the community.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Music className="h-4 w-4 text-primary" />
                    <p className="font-bold text-xl">{stats.totalKits}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Kits Created</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Download className="h-4 w-4 text-primary" />
                    <p className="font-bold text-xl">{stats.totalDownloads}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-primary" />
                    <p className="font-bold text-xl">{stats.totalLikes}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="font-bold text-xl">{stats.totalComments}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
            </div>

            <Button onClick={() => router.push("/settings")}>Edit Profile</Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="kits">My Kits ({kits.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="kits">
              {kits.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No kits created yet</p>
                  <Button className="mt-4" onClick={() => router.push("/")}>
                    Create Your First Kit
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kits.map((kit) => (
                    <Card key={kit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative bg-gradient-to-br from-primary/20 to-primary/5">
                        <img
                          src={kit.thumbnail || "/placeholder.svg"}
                          alt={kit.name}
                          className="object-cover w-full h-full"
                        />
                        <Badge className="absolute top-2 right-2">{kit.status}</Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg truncate">{kit.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {kit.sliceCount ?? kit.slices ?? 0} slices •{" "}
                          {kit.lastModified
                            ? formatDistanceToNow(new Date(kit.lastModified), { addSuffix: true })
                            : "just now"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {kit.downloads || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {kit.likes || 0}
                            </span>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/my-kits/${kit.id}`)}>
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-16 w-16 mx-auto mb-4" />
                <p>Your favorite kits will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm">Created a new drum kit</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm">Liked "Urban Beats Vol. 2"</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
