"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Bell, ShoppingCart, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"

const mockCartItems = [
  { id: "1", name: "LA Trap Essentials", price: 24.99, creator: "beatmaker99" },
  { id: "2", name: "Lofi Chill Pack", price: 19.99, creator: "drumgod" },
]

const mockNotifications = [
  { id: "1", message: "beatmaker99 liked your kit 'Sunset Drums'", time: "2 hours ago", read: false },
  { id: "2", message: "drumgod commented on 'Urban Beats'", time: "5 hours ago", read: false },
]

export function SignInOverlay() {
  const { login, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [notifications, setNotifications] = useState(mockNotifications)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("open-signin-overlay", handleOpen as EventListener)
    return () => window.removeEventListener("open-signin-overlay", handleOpen as EventListener)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast({ title: "Signed in", description: "Welcome back." })
      setOpen(false)
    } catch (error) {
      toast({ title: "Sign in failed", description: "Try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)

  if (pathname?.startsWith("/marketing")) {
    return null
  }

  return (
    <>
      <div
        className={`fixed right-4 top-4 z-40 flex items-center gap-3 rounded-full border border-white/15 px-4 py-2 transition ${
          scrolled ? "bg-black/25 backdrop-blur" : "bg-black/15"
        }`}
      >
        {isAuthenticated ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="text-white transition hover:bg-white/5 hover:shadow-[0_0_12px_rgba(245,217,122,0.35)]"
              onClick={() => setShowNotifications(true)}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white transition hover:bg-white/5 hover:shadow-[0_0_12px_rgba(245,217,122,0.35)]"
              onClick={() => setShowCart(true)}
              title="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="rounded-full border border-white/20 bg-transparent text-white transition hover:border-white/40 hover:shadow-[0_0_18px_rgba(245,217,122,0.25)]"
            onClick={() => setOpen(true)}
          >
            Sign In
          </Button>
        )}
      </div>

      {!isAuthenticated && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md border border-white/10 bg-gradient-to-br from-[#0d0c18] via-[#090712] to-[#040308] text-white">
            <div className="flex justify-center">
              <Image
                src="https://ik.imagekit.io/flxhsxcsf/drumkitzz3.png?updatedAt=1762301071257"
                alt="DrumKitzz"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-[#f5d97a]">Login</DialogTitle>
              <DialogDescription className="text-white/60">Continue with email to access DrumKitzz.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="overlay-email">Email</Label>
                <Input
                  id="overlay-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-white/20 bg-black/40 text-white"
                />
              </div>
              <div>
                <Label htmlFor="overlay-password">Password</Label>
                <Input
                  id="overlay-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-white/20 bg-black/40 text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-[#f5d97a] to-[#b37a09] text-black hover:brightness-110"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Continue with Email"}
              </Button>
              <div className="text-center text-sm text-white/60">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  className="font-semibold text-white underline-offset-4 hover:underline"
                  onClick={() => {
                    setOpen(false)
                    router.push("/home?signup=true")
                  }}
                >
                  Sign Up
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md border border-white/10 bg-black/80 text-white">
          <DialogHeader>
            <DialogTitle>Cart</DialogTitle>
            <DialogDescription className="text-white/60">
              {cartItems.length === 0 ? "Your cart is empty" : `${cartItems.length} item(s)`}
            </DialogDescription>
          </DialogHeader>
          {cartItems.length > 0 ? (
            <ScrollArea className="h-[260px] pr-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="mb-3 border-white/10 bg-white/5">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-white/60">by {item.creator}</p>
                    </div>
                    <div className="text-right">
                      <p>${item.price.toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:text-red-400"
                        onClick={() => setCartItems(cartItems.filter((c) => c.id !== item.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex items-center justify-between px-1 text-sm text-white/70">
                <span>Total</span>
                <span className="font-semibold text-white">${cartTotal.toFixed(2)}</span>
              </div>
            </ScrollArea>
          ) : (
            <div className="py-6 text-center text-white/60">Add kits from the marketplace to see them here.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-sm border border-white/10 bg-black/80 text-white">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription className="text-white/60">Latest kit activity</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[260px] pr-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="mb-3 border-white/10 bg-white/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <Bell className="h-4 w-4 text-[#f5d97a]" />
                  <div>
                    <p className="text-sm text-white/80">{notification.message}</p>
                    <p className="text-xs text-white/50">{notification.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
