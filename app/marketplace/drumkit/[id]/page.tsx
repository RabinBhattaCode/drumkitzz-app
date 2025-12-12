"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { CommentSection } from "@/app/components/comments/comment-section"
import { Star, Download, Heart, Share2, Play } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/lib/auth-context"

type Kit = {
  id: string
  name: string | null
  description: string | null
  cover_image_path: string | null
  like_count: number | null
  download_count: number | null
  visibility: string | null
  created_at: string | null
  updated_at: string | null
}

type KitAsset = {
  id: string
  asset_type: string | null
  storage_path: string
  signedUrl?: string
}

const bucketForAsset = (assetType?: string | null) => {
  if (assetType === "stem") return "stems"
  if (assetType === "preview") return "stems"
  if (assetType === "original") return "chops"
  return "chops"
}

export default function DrumkitPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [kit, setKit] = useState<Kit | null>(null)
  const [assets, setAssets] = useState<KitAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const supabase = createBrowserClient()

      const { data: kitRow, error: kitErr } = await supabase
        .from("kits")
        .select("id,name,description,cover_image_path,like_count,download_count,visibility,created_at,updated_at")
        .eq("id", params.id)
        .single()

      if (kitErr || !kitRow) {
        setError(kitErr?.message || "Kit not found")
        setLoading(false)
        return
      }

      setKit(kitRow)

      const { data: assetRows, error: assetErr } = await supabase
        .from("kit_assets")
        .select("id, asset_type, storage_path")
        .eq("kit_id", params.id)

      if (assetErr) {
        setError(assetErr.message)
        setLoading(false)
        return
      }

      const withUrls: KitAsset[] = []
      for (const a of assetRows || []) {
        const bucket = bucketForAsset(a.asset_type)
        try {
          const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(a.storage_path, 60 * 60)
          withUrls.push({ ...a, signedUrl: signed?.signedUrl })
        } catch {
          withUrls.push(a)
        }
      }

      setAssets(withUrls)
      setLoading(false)
    }

    void load()
  }, [params.id])

  const sounds = useMemo(() => assets.filter((a) => a.asset_type === "chop" || a.asset_type === "preview" || a.asset_type === "original"), [assets])

  if (loading) {
    return <div className="container mx-auto py-8 px-4 text-white/70">Loading kit...</div>
  }

  if (error || !kit) {
    return <div className="container mx-auto py-8 px-4 text-red-400">Error: {error || "Kit not found"}</div>
  }

  const cover =
    kit.cover_image_path ||
    "https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png?updatedAt=1763080146104"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <Image src={cover} alt={kit.name || "Drum kit"} fill className="object-cover" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{kit.visibility === "public" ? "Public" : "Private"}</span>
              <span>•</span>
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                <span>{kit.download_count ?? 0}</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                <span>{kit.like_count ?? 0}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold mt-2">{kit.name || "Untitled kit"}</h1>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">Slices: {sounds.length}</Badge>
            </div>
          </div>

          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="samples">Samples ({sounds.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <p className="text-white/80">{kit.description || "No description provided."}</p>
            </TabsContent>
            <TabsContent value="samples" className="mt-4">
              {sounds.length === 0 ? (
                <div className="text-white/60">No samples yet.</div>
              ) : (
                <div className="space-y-2">
                  {sounds.map((sample) => (
                    <Card key={sample.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium truncate">{sample.storage_path.split("/").pop()}</div>
                            <div className="text-sm text-muted-foreground">{sample.asset_type || "chop"}</div>
                          </div>
                          {sample.signedUrl ? (
                            <audio src={sample.signedUrl} controls className="h-8" preload="none" />
                          ) : (
                            <span className="text-xs text-muted-foreground">No preview</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CommentSection kitId={params.id} />
    </div>
  )
}
