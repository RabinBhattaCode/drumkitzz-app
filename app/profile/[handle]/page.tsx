import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

const defaultImage =
  "https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png?updatedAt=1763080146104"

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  backdrop_url?: string | null
  handle?: string | null
}

async function getProfile(handle: string): Promise<Profile | null> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000"
  const res = await fetch(`${base}/api/profiles/${handle}`, { cache: "no-store" })
  if (!res.ok) return null
  const body = await res.json()
  return body.profile as Profile
}

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const profile = await getProfile(handle)

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 text-white">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold">Profile not found</p>
            <p className="text-sm text-white/70 mt-2">The handle @{handle} does not exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0a10] text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#101424] via-[#0b0f1c] to-[#0b0a10] p-6 md:p-8">
          {profile.backdrop_url && (
            <Image
              src={profile.backdrop_url}
              alt="Backdrop"
              fill
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
          )}
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={profile.avatar_url || defaultImage}
                alt={profile.username || "avatar"}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-white/40 object-cover shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-semibold">
                  {profile.display_name || profile.username || "Producer"}
                </h1>
                <p className="text-white/70">@{profile.handle || profile.username || "unknown"}</p>
                {profile.bio && <p className="mt-2 max-w-2xl text-white/80">{profile.bio}</p>}
              </div>
            </div>
            <Badge variant="outline" className="border-white/30 text-white/80">
              Public profile
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
