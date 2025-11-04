"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Download, ShoppingCart, Search, Filter, Star, UserPlus } from "lucide-react"

// Mock drum kit data
const mockDrumKits = [
  {
    id: "kit1",
    name: "LA Trap Essentials",
    description: "Hard-hitting trap drums with punchy 808s",
    imageUrl: "/trap-drums.png",
    price: 24.99,
    downloads: 3200,
    likes: 1450,
    rating: 4.8,
    creator: "beatmaker99",
    creatorName: "Alex Johnson",
    creatorAvatar: "/placeholder.svg",
    tags: ["trap", "808", "hip-hop"],
    date: "2023-10-15",
    featured: true,
  },
  {
    id: "kit2",
    name: "Lofi Chill Pack",
    description: "Warm, vintage drum samples perfect for lofi beats",
    imageUrl: "/lofi-drums.png",
    price: 19.99,
    downloads: 2100,
    likes: 980,
    rating: 4.9,
    creator: "drumgod",
    creatorName: "Sarah Williams",
    creatorAvatar: "/placeholder.svg",
    tags: ["lofi", "chill", "vintage"],
    date: "2023-08-22",
  },
  {
    id: "kit3",
    name: "Boom Bap Classics",
    description: "Classic hip-hop drums inspired by the 90s",
    imageUrl: "/boom-bap-beat.png",
    price: 0,
    downloads: 5400,
    likes: 2300,
    rating: 4.7,
    creator: "rhythmmaster",
    creatorName: "Mike Chen",
    creatorAvatar: "/placeholder.svg",
    tags: ["boom bap", "hip-hop", "classic"],
    date: "2023-06-10",
  },
]

// Mock friends data
const mockFriends = [
  {
    id: "1",
    username: "beatmaker99",
    name: "Alex Johnson",
    avatar: "/placeholder.svg",
    kitsPublished: 12,
    followers: 3400,
    isFollowing: true,
    bio: "Trap & Hip-Hop producer from LA",
  },
  {
    id: "2",
    username: "drumgod",
    name: "Sarah Williams",
    avatar: "/placeholder.svg",
    kitsPublished: 8,
    followers: 2100,
    isFollowing: true,
    bio: "Lofi & Chill beats enthusiast",
  },
  {
    id: "3",
    username: "rhythmmaster",
    name: "Mike Chen",
    avatar: "/placeholder.svg",
    kitsPublished: 15,
    followers: 5200,
    isFollowing: false,
    bio: "90s Hip-Hop & Boom Bap specialist",
  },
  {
    id: "4",
    username: "sampleking",
    name: "Jordan Lee",
    avatar: "/placeholder.svg",
    kitsPublished: 6,
    followers: 1800,
    isFollowing: false,
    bio: "Electronic & Techno producer",
  },
]

export function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 50])
  const [sortBy, setSortBy] = useState("popular")
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [likedKits, setLikedKits] = useState<Record<string, boolean>>({})
  const [cartItems, setCartItems] = useState<Record<string, boolean>>({})
  const [friends, setFriends] = useState(mockFriends)

  // Filter and sort kits
  const filteredKits = mockDrumKits
    .filter((kit) => {
      if (
        searchQuery &&
        !kit.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !kit.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !kit.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false
      }
      if (kit.price < priceRange[0] || kit.price > priceRange[1]) {
        return false
      }
      if (showFreeOnly && kit.price > 0) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "rating":
          return b.rating - a.rating
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        default:
          return 0
      }
    })

  const toggleLike = (kitId: string) => {
    setLikedKits((prev) => ({
      ...prev,
      [kitId]: !prev[kitId],
    }))
  }

  const toggleCart = (kitId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [kitId]: !prev[kitId],
    }))
  }

  const toggleFollow = (friendId: string) => {
    setFriends(friends.map((f) => (f.id === friendId ? { ...f, isFollowing: !f.isFollowing } : f)))
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="kits" className="w-full">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">Discover drum kits and connect with creators</p>
          </div>
          <TabsList>
            <TabsTrigger value="kits">Drum Kits</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>
        </div>

        {/* Drum Kits Tab */}
        <TabsContent value="kits" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search kits..."
                  className="pl-8 w-[200px] md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </Label>
                    <Slider value={priceRange} min={0} max={50} step={1} onValueChange={setPriceRange} />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="free-only"
                      checked={showFreeOnly}
                      onCheckedChange={(checked) => setShowFreeOnly(!!checked)}
                    />
                    <Label htmlFor="free-only">Show free kits only</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKits.map((kit) => (
              <Card key={kit.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative">
                  <img src={kit.imageUrl || "/placeholder.svg"} alt={kit.name} className="object-cover w-full h-full" />
                  {kit.featured && <Badge className="absolute top-2 left-2 bg-amber-500">Featured</Badge>}
                  {kit.price === 0 ? (
                    <Badge className="absolute top-2 right-2 bg-green-500">Free</Badge>
                  ) : (
                    <Badge className="absolute top-2 right-2">${kit.price}</Badge>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{kit.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={kit.creatorAvatar || "/placeholder.svg"} />
                      <AvatarFallback>{kit.creatorName[0]}</AvatarFallback>
                    </Avatar>
                    by {kit.creatorName}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-2 flex-grow">
                  <p className="text-sm text-muted-foreground">{kit.description}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {kit.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between pt-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{kit.downloads.toLocaleString()}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={likedKits[kit.id] ? "text-red-500" : "text-muted-foreground"}
                      onClick={() => toggleLike(kit.id)}
                    >
                      <Heart className="h-4 w-4" fill={likedKits[kit.id] ? "currentColor" : "none"} />
                    </Button>

                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">{kit.rating}</span>
                    </div>
                  </div>

                  {kit.price > 0 ? (
                    <Button
                      size="sm"
                      variant={cartItems[kit.id] ? "secondary" : "default"}
                      onClick={() => toggleCart(kit.id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {cartItems[kit.id] ? "In Cart" : "Add"}
                    </Button>
                  ) : (
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredKits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No drum kits found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="creators" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search creators..." className="pl-8 max-w-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {friends.map((friend) => (
              <Card key={friend.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{friend.name}</CardTitle>
                      <CardDescription>@{friend.username}</CardDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-sm">
                          <span className="font-semibold">{friend.kitsPublished}</span> Kits
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">{friend.followers.toLocaleString()}</span> Followers
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{friend.bio}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant={friend.isFollowing ? "secondary" : "default"}
                    className="flex-1"
                    onClick={() => toggleFollow(friend.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {friend.isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">View Profile</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
