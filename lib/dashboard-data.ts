export interface DrumKit {
  id: string
  projectId?: string
  name: string
  sliceCount: number
  status: "draft" | "finished"
  lastModified: Date
  thumbnail?: string
  views?: number
  downloads?: number
  likes?: number
  visibility: "public" | "private"
  price?: number
  currency?: string
}

export interface Friend {
  id: string
  username: string
  name: string
  avatar?: string
  kitsPublished: number
  followers: number
  isFollowing: boolean
  bio: string
}

export interface Activity {
  id: string
  type: "created" | "exported" | "shared" | "liked"
  kitName: string
  timestamp: Date
}

const STORAGE_KEY = "drumkitzz_kits"

// Mock data
const mockKits: DrumKit[] = [
  {
    id: "1",
    projectId: "proj-1",
    name: "Sunset Drums",
    sliceCount: 12,
    status: "finished",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2),
    thumbnail: "/trap-drums.png",
    views: 145,
    downloads: 32,
    likes: 18,
    visibility: "public",
    price: 0,
  },
  {
    id: "2",
    projectId: "proj-2",
    name: "Urban Beats",
    sliceCount: 8,
    status: "draft",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24),
    thumbnail: "/lofi-drums.png",
    views: 0,
    downloads: 0,
    likes: 0,
    visibility: "private",
    price: 0,
  },
  {
    id: "3",
    projectId: "proj-3",
    name: "Vintage Kit",
    sliceCount: 16,
    status: "finished",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48),
    thumbnail: "/boom-bap-beat.png",
    views: 289,
    downloads: 67,
    likes: 45,
    visibility: "public",
    price: 29,
    currency: "USD",
  },
  {
    id: "4",
    projectId: "proj-4",
    name: "Electronic Pack",
    sliceCount: 5,
    status: "draft",
    lastModified: new Date(Date.now() - 1000 * 60 * 30),
    thumbnail: "/placeholder.svg",
    views: 0,
    downloads: 0,
    likes: 0,
    visibility: "private",
    price: 0,
  },
]

const mockFriends: Friend[] = [
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
]

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "created",
    kitName: "Electronic Pack",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    type: "exported",
    kitName: "Vintage Kit",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "3",
    type: "shared",
    kitName: "Sunset Drums",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "4",
    type: "liked",
    kitName: "Urban Beats",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
]

export function getDrumKits(): DrumKit[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const kits = JSON.parse(stored)
      return kits.map((k: any) => ({
        ...k,
        lastModified: new Date(k.lastModified),
        visibility: k.visibility || "private",
      }))
    } catch (e) {
      console.error("Failed to parse stored kits:", e)
    }
  }

  // Initialize with mock data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockKits))
  return mockKits
}

export function saveDrumKit(kit: DrumKit) {
  if (typeof window === "undefined") return

  const kits = getDrumKits()
  const existingIndex = kits.findIndex((k) => k.id === kit.id)
  const normalizedKit: DrumKit = {
    ...kit,
    visibility: kit.visibility || "private",
    lastModified: kit.lastModified || new Date(),
  }

  if (existingIndex >= 0) {
    kits[existingIndex] = normalizedKit
  } else {
    kits.push(normalizedKit)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(kits))
}

export function deleteDrumKit(id: string) {
  if (typeof window === "undefined") return

  const kits = getDrumKits()
  const filtered = kits.filter((k) => k.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function getFriends(): Friend[] {
  return mockFriends
}

export function getActivities(): Activity[] {
  return mockActivities
}

export function getKits(): DrumKit[] {
  return getDrumKits()
}
