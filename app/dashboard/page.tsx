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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Music, CheckCircle2, FileEdit, Users, Play, Trash2, Plus, Clock, Share2, Heart, Download } from "lucide-react"

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const finishedKits = kits.filter((k) => k.status === "finished")
  const draftKits = kits.filter((k) => k.status === "draft")

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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.username} />
            <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your drum kits</p>
          </div>
        </div>
        <Button onClick={() => router.push("/")} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create New Kit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Kits</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kits.length}</div>
                <p className="text-xs text-muted-foreground">All drum kits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finished</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{finishedKits.length}</div>
                <p className="text-xs text-muted-foreground">Completed projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <FileEdit className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{draftKits.length}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Friends</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{friends.length}</div>
                <p className="text-xs text-muted-foreground">Connected users</p>
              </CardContent>
            </Card>
          </div>

          {/* Drum Kits Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>My Drum Kits</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({kits.length})</TabsTrigger>
                  <TabsTrigger value="finished">Finished ({finishedKits.length})</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts ({draftKits.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {kits.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No drum kits yet</p>
                      <Button onClick={() => router.push("/")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Kit
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {kits.map((kit) => (
                        <Card key={kit.id} className="overflow-hidden">
                          <div className="aspect-video relative bg-muted">
                            <img
                              src={kit.thumbnail || "/placeholder.svg"}
                              alt={kit.name}
                              className="object-cover w-full h-full"
                            />
                            <Badge
                              className="absolute top-2 right-2"
                              variant={kit.status === "finished" ? "default" : "secondary"}
                            >
                              {kit.status === "finished" ? (
                                <>
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Finished
                                </>
                              ) : (
                                <>
                                  <FileEdit className="mr-1 h-3 w-3" /> Draft
                                </>
                              )}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{kit.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <span>{kit.sliceCount} slices</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(kit.lastModified)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-transparent"
                                onClick={() => router.push(`/my-kits/${kit.id}`)}
                              >
                                <FileEdit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline">
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(kit.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="finished" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {finishedKits.map((kit) => (
                      <Card key={kit.id} className="overflow-hidden">
                        <div className="aspect-video relative bg-muted">
                          <img
                            src={kit.thumbnail || "/placeholder.svg"}
                            alt={kit.name}
                            className="object-cover w-full h-full"
                          />
                          <Badge className="absolute top-2 right-2">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Finished
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{kit.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span>{kit.sliceCount} slices</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(kit.lastModified)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-transparent"
                              onClick={() => router.push(`/my-kits/${kit.id}`)}
                            >
                              <FileEdit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(kit.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="drafts" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {draftKits.map((kit) => (
                      <Card key={kit.id} className="overflow-hidden">
                        <div className="aspect-video relative bg-muted">
                          <img
                            src={kit.thumbnail || "/placeholder.svg"}
                            alt={kit.name}
                            className="object-cover w-full h-full"
                          />
                          <Badge className="absolute top-2 right-2" variant="secondary">
                            <FileEdit className="mr-1 h-3 w-3" /> Draft
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{kit.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span>{kit.sliceCount} slices</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(kit.lastModified)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-transparent"
                              onClick={() => router.push(`/my-kits/${kit.id}`)}
                            >
                              <FileEdit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(kit.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Friends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.username} />
                      <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{friend.username}</p>
                    <p className="text-xs text-muted-foreground">{friend.sharedKits} kits shared</p>
                  </div>
                </div>
              ))}
              <Separator />
              <Button variant="outline" className="w-full bg-transparent" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-full bg-muted">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {activity.type === "created" && "Created "}
                      {activity.type === "exported" && "Exported "}
                      {activity.type === "shared" && "Shared "}
                      {activity.type === "liked" && "Liked "}
                      <span className="font-medium">{activity.kitName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
