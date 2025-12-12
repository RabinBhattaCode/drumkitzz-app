"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Lock, Palette, Upload, Image as ImageIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase-browser"

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) // display priority
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null) // display priority
  const [avatarRemote, setAvatarRemote] = useState<string | null>(null)
  const [backdropRemote, setBackdropRemote] = useState<string | null>(null)
  const [serverAvatar, setServerAvatar] = useState<string | null>(null)
  const [serverBackdrop, setServerBackdrop] = useState<string | null>(null)
  const [avatarDirty, setAvatarDirty] = useState(false)
  const [backdropDirty, setBackdropDirty] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const backdropInputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createBrowserClient(), [])
  const [supportsBackdropColumn, setSupportsBackdropColumn] = useState(true)
  const [profileLoadedOnce, setProfileLoadedOnce] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    } else if (user) {
      setUsername(user.username || "")
      setEmail(user.email || "")
    }
  }, [isAuthenticated, user, router])

  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    setProfileLoading(true)

    const selectCols = supportsBackdropColumn ? "id,username,bio,avatar_url,backdrop_url" : "id,username,bio,avatar_url"
    const { data, error } = await supabase
      .from("profiles")
      .select(selectCols)
      .eq("id", user.id)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // Column missing: retry without backdrop
      if (error.message?.toLowerCase().includes("backdrop_url")) {
        setSupportsBackdropColumn(false)
        setProfileLoading(false)
        return
      }
      console.error("Failed to load profile", error)
      toast({
        title: "Could not load profile",
        description: "We had trouble loading your profile details.",
        variant: "destructive",
      })
      setProfileLoading(false)
      return
    }

    let profileData = data
    if (!profileData) {
      const fallbackProfile: Record<string, any> = {
        id: user.id,
        username: user.username || user.email?.split("@")[0] || null,
        bio: null,
        avatar_url: null,
      }
      if (supportsBackdropColumn) {
        fallbackProfile.backdrop_url = null
      }
      const { data: upserted, error: upsertError } = await supabase
        .from("profiles")
        .upsert(fallbackProfile)
        .select(selectCols)
        .single()

      if (upsertError) {
        if (upsertError.message?.toLowerCase().includes("backdrop_url")) {
          setSupportsBackdropColumn(false)
          setProfileLoading(false)
          return
        }
        console.error("Failed to create profile", upsertError)
        toast({
          title: "Could not load profile",
          description: "We had trouble loading your profile details.",
          variant: "destructive",
        })
        setProfileLoading(false)
        return
      }
      profileData = upserted
    }

    setUsername(profileData?.username || user.username || "")
    setBio(profileData?.bio || "")
    const avatarFromProfile = profileData?.avatar_url || user.avatar || null
    const backdropFromProfile = profileData?.backdrop_url ?? user.backdrop ?? null
    setServerAvatar(avatarFromProfile)
    setServerBackdrop(backdropFromProfile)
    if (!avatarDirty) {
      setAvatarPreview(avatarFromProfile)
      setAvatarRemote(avatarFromProfile)
    }
    if (!backdropDirty) {
      setBackdropPreview(backdropFromProfile)
      setBackdropRemote(backdropFromProfile)
    }
    setProfileLoadedOnce(true)
    setProfileLoading(false)
  }, [supportsBackdropColumn, supabase, toast, user, avatarDirty, backdropDirty])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  if (!isAuthenticated || !user) {
    return null
  }

  const handleImageUpload = async (file: File, type: "avatar" | "backdrop") => {
    if (!user?.id) return
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast({
        title: "Unsupported image",
        description: "Use PNG, JPG, or WEBP files under 5MB.",
        variant: "destructive",
      })
      return
    }

    const sizeLimit = 5 * 1024 * 1024
    if (file.size > sizeLimit) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Immediate local preview
    const objectUrl = URL.createObjectURL(file)
    if (type === "avatar") {
      setAvatarPreview(objectUrl)
      setAvatarDirty(true)
    } else {
      setBackdropPreview(objectUrl)
      setBackdropDirty(true)
    }

    const getPublicOrSignedUrl = async (bucket: string, path: string) => {
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl
      if (publicUrl) return publicUrl
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 30) // 30 days
      return signed?.signedUrl ?? null
    }

    const ext = file.name.split(".").pop() || "png"
    const kind = type === "avatar" ? "avatar" : "backdrop"
    const path = `${user.id}/profile/${kind}-${Date.now()}.${ext}`
    const bucketsToTry = ["covers", "kit-artwork"]
    let uploadedUrl: string | null = null

    for (const bucket of bucketsToTry) {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (uploadError) {
        const message = (uploadError as any)?.message?.toLowerCase?.() || ""
        const isMissingBucket = message.includes("does not exist") || message.includes("not found")
        if (isMissingBucket) {
          console.warn(`Bucket ${bucket} missing, trying fallback`)
          continue
        }
        console.error(uploadError)
        toast({
          title: "Upload failed",
          description: uploadError.message || "We couldn't upload that image. Please try again.",
          variant: "destructive",
        })
        return
      }

      const publicUrl = await getPublicOrSignedUrl(bucket, path)
      if (!publicUrl) {
        console.warn(`No public or signed URL from bucket ${bucket}`)
        continue
      }
      uploadedUrl = publicUrl
      break
    }

    if (!uploadedUrl) {
      toast({
        title: "Could not create URL",
        description: "Upload finished but no public URL returned. Check storage bucket visibility.",
        variant: "destructive",
      })
      return
    }

    if (type === "avatar") {
      setAvatarRemote(uploadedUrl)
      setAvatarPreview(uploadedUrl)
    } else {
      setBackdropRemote(uploadedUrl)
      setBackdropPreview(uploadedUrl)
    }

    toast({
      title: type === "avatar" ? "Avatar ready" : "Backdrop ready",
      description: "Save changes to update your profile.",
    })
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    // Prevent saving blob-only previews
    if (avatarPreview && !avatarRemote && avatarPreview.startsWith("blob:")) {
      toast({
        title: "Finish avatar upload",
        description: "We couldn't get a public URL for your avatar. Please retry the upload.",
        variant: "destructive",
      })
      return
    }
    if (backdropPreview && !backdropRemote && backdropPreview.startsWith("blob:")) {
      toast({
        title: "Finish backdrop upload",
        description: "We couldn't get a public URL for your backdrop. Please retry the upload.",
        variant: "destructive",
      })
      return
    }
    setIsSavingProfile(true)

    const avatarToSave = avatarRemote ?? serverAvatar ?? null
    const backdropToSave = backdropRemote ?? serverBackdrop ?? null

    const profilePayload: Record<string, any> = {
      id: user.id,
      username: username || null,
      bio: bio || null,
      avatar_url: avatarToSave,
    }
    if (supportsBackdropColumn) {
      profilePayload.backdrop_url = backdropToSave
    }

    const { error } = await supabase.from("profiles").upsert(profilePayload)
    if (error) {
      console.error("Profile save failed", error)
      toast({
        title: "Could not save profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
      setIsSavingProfile(false)
      return
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        username: username || null,
        avatar_url: avatarToSave,
        backdrop_url: backdropToSave,
      },
    })
    if (authError) {
      console.warn("Auth metadata update failed", authError)
    }

    if (profileLoadedOnce) {
      void loadProfile()
    }

    await supabase.auth.refreshSession()

    setServerAvatar(avatarToSave)
    setServerBackdrop(backdropToSave)
    setAvatarPreview(avatarToSave)
    setBackdropPreview(backdropToSave)
    setAvatarRemote(avatarToSave)
    setBackdropRemote(backdropToSave)
    setAvatarDirty(false)
    setBackdropDirty(false)

    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    })
    setIsSavingProfile(false)
  }

  const handleSaveNotifications = () => {
    toast({
      title: "Notification preferences saved",
      description: "Your notification settings have been updated.",
    })
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile details and public information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
                <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || serverAvatar || user.avatar || "/placeholder.svg"} alt={user.username} />
                    <AvatarFallback className="text-2xl">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="gap-2" onClick={() => avatarInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Change Avatar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG or WEBP. Max size 5MB.</p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleImageUpload(file, "avatar")
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Profile backdrop</Label>
                  <div className="relative h-32 overflow-hidden rounded-xl border border-dashed border-muted-foreground/30 bg-muted">
                    {backdropPreview ? (
                      <img src={backdropPreview} alt="Profile backdrop" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>No backdrop uploaded</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => backdropInputRef.current?.click()}>
                        <Upload className="h-4 w-4" />
                        Upload Backdrop
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Appears behind your profile header.</p>
                  <input
                    ref={backdropInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleImageUpload(file, "backdrop")
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Brief description for your profile.</p>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
                </div>
                <Switch id="marketing-emails" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>

              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <Button>Update Password</Button>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how DrumKitzz looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground mb-4">Select your preferred theme</p>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4 text-center">
                      <div className="h-20 rounded-md bg-background border mb-2" />
                      <p className="text-sm font-medium">Light</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary transition-colors border-primary">
                    <CardContent className="p-4 text-center">
                      <div className="h-20 rounded-md bg-slate-950 border mb-2" />
                      <p className="text-sm font-medium">Dark</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4 text-center">
                      <div className="h-20 rounded-md bg-gradient-to-br from-background to-slate-950 border mb-2" />
                      <p className="text-sm font-medium">System</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use a more compact layout</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
