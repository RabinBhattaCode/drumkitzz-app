export type KitStatus = "draft" | "processing" | "ready" | "published" | "archived"
export type KitVisibility = "public" | "private"

export interface Profile {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  createdAt: string
  updatedAt: string
}

export interface KitProject {
  id: string
  ownerId: string
  title: string
  sourceAudioPath: string | null
  sourceDuration: number | null
  sliceSettings: Record<string, unknown>
  status: KitStatus
  linkedKitId: string | null
  createdAt: string
  updatedAt: string
}

export interface Kit {
  id: string
  ownerId: string
  projectId: string | null
  name: string
  description: string | null
  coverImagePath: string | null
  bundlePath: string | null
  priceCents: number
  currency: string
  visibility: KitVisibility
  status: KitStatus
  downloadCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
}

export interface KitSlice {
  id: string
  projectId: string
  kitId: string | null
  name: string | null
  type: string | null
  startTime: number
  endTime: number
  fadeInMs: number
  fadeOutMs: number
  metadata: Record<string, unknown>
  createdAt: string
}

export interface Purchase {
  id: string
  kitId: string
  buyerId: string
  amountCents: number
  currency: string
  stripePaymentId: string | null
  status: string
  downloadExpiresAt: string | null
  createdAt: string
}
