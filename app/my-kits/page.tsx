"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getDrumKits, deleteDrumKit, type DrumKit } from "@/lib/dashboard-data"
import { Music, Plus, FileEdit, CheckCircle2, Clock, Trash2, Play, Download, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your kits...</p>
        </div>
      </div>
    )
  }

  const finishedKits = kits.filter((k) => k.status === "finished")
  const draftKits = kits.filter((k) => k.status === "draft")

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Drum Kits</h1>
          <p className="text-muted-foreground">Manage your drum kit collection</p>
        </div>
        <Link href="/">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create New Kit
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Kits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kits.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finished</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{finishedKits.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{draftKits.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Slices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kits.reduce((sum, k) => sum + k.sliceCount, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kits Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({kits.length})</TabsTrigger>
          <TabsTrigger value="finished">Finished ({finishedKits.length})</TabsTrigger>
          <TabsTrigger value="drafts">In Progress ({draftKits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {kits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No drum kits yet</h3>
                <p className="text-muted-foreground mb-4">Create your first drum kit to get started</p>
                <Link href="/">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Kit
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <Clock className="mr-1 h-3 w-3" /> Draft
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{kit.name}</CardTitle>
                    <CardDescription>{formatDate(kit.lastModified)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(getKitProgress(kit))}%</span>
                      </div>
                      <Progress value={getKitProgress(kit)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Slices</p>
                        <p className="font-semibold">{kit.sliceCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-semibold">{kit.views || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Downloads</p>
                        <p className="font-semibold">{kit.downloads || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Likes</p>
                        <p className="font-semibold">{kit.likes || 0}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/my-kits/${kit.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-transparent" variant="outline">
                          <FileEdit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(kit.id, kit.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finished" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <CardHeader>
                  <CardTitle className="text-lg">{kit.name}</CardTitle>
                  <CardDescription>{formatDate(kit.lastModified)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Slices</p>
                      <p className="font-semibold">{kit.sliceCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-semibold">{kit.views || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-semibold">{kit.downloads || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Likes</p>
                      <p className="font-semibold">{kit.likes || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/my-kits/${kit.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-transparent" variant="outline">
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(kit.id, kit.name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftKits.map((kit) => (
              <Card key={kit.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  <img
                    src={kit.thumbnail || "/placeholder.svg"}
                    alt={kit.name}
                    className="object-cover w-full h-full"
                  />
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    <Clock className="mr-1 h-3 w-3" /> Draft
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{kit.name}</CardTitle>
                  <CardDescription>{formatDate(kit.lastModified)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(getKitProgress(kit))}%</span>
                    </div>
                    <Progress value={getKitProgress(kit)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Slices</p>
                      <p className="font-semibold">{kit.sliceCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-semibold text-orange-600">In Progress</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/my-kits/${kit.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        <FileEdit className="h-4 w-4 mr-2" />
                        Continue Editing
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(kit.id, kit.name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
