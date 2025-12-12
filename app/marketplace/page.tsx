"use client"

import type React from "react"

import { Marketplace } from "@/app/components/marketplace/marketplace"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MarketplacePage() {
  const { isAuthenticated, login } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
    setShowLoginPrompt(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Only show to logged-out users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-b from-primary/10 to-background border-b">
          <div className="container mx-auto py-12 px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-balance">Marketplace</h1>
              <p className="text-xl text-muted-foreground text-balance">
                Real drum kit listings will appear here as producers publish them. No placeholder kits.
              </p>
              <Button size="lg" onClick={() => setShowLoginPrompt(true)}>
                Sign Up to publish or buy kits
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Features Banner - Only show to logged-out users */}
      {!isAuthenticated && (
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto py-4 px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Sign in to unlock purchasing, following creators, and saving favorites
                </p>
              </div>
              <Button onClick={() => setShowLoginPrompt(true)}>Log In</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Marketplace Component */}
      <Marketplace />

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log In to DrumKitzz</DialogTitle>
            <DialogDescription>Sign in to purchase kits, follow creators, and save your favorites</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter any password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Log In
            </Button>
            <p className="text-xs text-center text-muted-foreground">Demo mode: Any credentials will work</p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
