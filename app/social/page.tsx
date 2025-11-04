"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthForms } from "../components/auth/auth-forms"
import { UserProfile } from "../components/profile/user-profile"
import { Leaderboard } from "../components/leaderboard/leaderboard"
import { Marketplace } from "../components/marketplace/marketplace"
import { Comments } from "../components/social/comments"

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("marketplace")

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">DrumKitzz Community</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <Marketplace />
        </TabsContent>

        <TabsContent value="profile">
          <UserProfile />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="comments">
          <div className="max-w-3xl mx-auto">
            <Comments />
          </div>
        </TabsContent>

        <TabsContent value="auth">
          <div className="max-w-md mx-auto">
            <AuthForms />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
