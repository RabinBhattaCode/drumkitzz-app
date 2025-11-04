"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { CommentSection } from "@/app/components/comments/comment-section"
import { Star, Download, ShoppingCart, Heart, Share2, Play, Pause } from "lucide-react"

// Mock data for a drumkit
const MOCK_DRUMKIT = {
  id: "boom-bap-essentials",
  name: "Boom Bap Essentials",
  creator: "DrumMaster",
  image: "/boom-bap-beat.png",
  price: 24.99,
  rating: 4.8,
  ratingCount: 156,
  downloads: 1250,
  description:
    "The ultimate collection of classic boom bap drums, perfect for hip-hop producers looking for that authentic 90s sound. This kit includes 50 meticulously crafted samples including punchy kicks, snappy snares, and vintage hi-hats.",
  tags: ["Hip-Hop", "Boom Bap", "90s", "Vintage"],
  samples: [
    { id: "kick1", name: "Classic Kick", type: "kick", duration: "0.5s" },
    { id: "snare1", name: "Vinyl Snare", type: "snare", duration: "0.7s" },
    { id: "hihat1", name: "Crisp Hi-Hat", type: "hi-hat", duration: "0.3s" },
    { id: "kick2", name: "Punchy Kick", type: "kick", duration: "0.4s" },
    { id: "snare2", name: "Layered Snare", type: "snare", duration: "0.8s" },
    { id: "perc1", name: "Tambourine", type: "percussion", duration: "1.2s" },
  ],
}

export default function DrumkitPage({ params }: { params: { id: string } }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState("description")
  const [isLiked, setIsLiked] = useState(false)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    // In a real app, this would trigger audio playback
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <Image
              src={MOCK_DRUMKIT.image || "/placeholder.svg"}
              alt={MOCK_DRUMKIT.name}
              fill
              className="object-cover"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 right-4 h-12 w-12 rounded-full"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>By {MOCK_DRUMKIT.creator}</span>
              <span>•</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span>{MOCK_DRUMKIT.rating}</span>
                <span className="ml-1">({MOCK_DRUMKIT.ratingCount})</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                <span>{MOCK_DRUMKIT.downloads}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold mt-2">{MOCK_DRUMKIT.name}</h1>

            <div className="flex flex-wrap gap-2 mt-4">
              {MOCK_DRUMKIT.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">${MOCK_DRUMKIT.price}</div>
            <Button className="flex-1">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsLiked(!isLiked)}>
              <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="samples">Samples ({MOCK_DRUMKIT.samples.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <p>{MOCK_DRUMKIT.description}</p>
            </TabsContent>
            <TabsContent value="samples" className="mt-4">
              <div className="space-y-2">
                {MOCK_DRUMKIT.samples.map((sample) => (
                  <Card key={sample.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{sample.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sample.type} • {sample.duration}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CommentSection kitId={params.id} />
    </div>
  )
}
