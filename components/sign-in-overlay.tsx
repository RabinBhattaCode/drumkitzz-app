"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { Bell, ShoppingCart, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AuthForms } from "@/app/components/auth/auth-forms"

const mockCartItems = [
  { id: "1", name: "LA Trap Essentials", price: 24.99, creator: "beatmaker99" },
  { id: "2", name: "Lofi Chill Pack", price: 19.99, creator: "drumgod" },
]

const mockNotifications = [
  { id: "1", message: "beatmaker99 liked your kit 'Sunset Drums'", time: "2 hours ago", read: false },
  { id: "2", message: "drumgod commented on 'Urban Beats'", time: "5 hours ago", read: false },
]

export function SignInOverlay({ showTopBar = true }: { showTopBar?: boolean }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
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
    const handleOpen = (event: Event) => {
      const custom = event as CustomEvent<{ mode?: "login" | "signup" }>
      setAuthMode(custom.detail?.mode ?? "login")
      setOpen(true)
    }
    const handleClose = () => setOpen(false)
    window.addEventListener("open-auth-overlay", handleOpen as EventListener)
    window.addEventListener("close-auth-overlay", handleClose as EventListener)
    return () => {
      window.removeEventListener("open-auth-overlay", handleOpen as EventListener)
      window.removeEventListener("close-auth-overlay", handleClose as EventListener)
    }
  }, [])

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)

  return (
    <>
      {showTopBar && (
        <div
          className={`fixed right-4 top-4 z-40 flex items-center gap-3 rounded-full px-2 py-2 transition ${
            scrolled ? "bg-black/10 backdrop-blur" : "bg-transparent"
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
            className="rounded-full border-none bg-amber-400/90 px-4 text-black shadow-none transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-0"
            onClick={() => {
              setAuthMode("login")
              setOpen(true)
            }}
          >
            Sign In
          </Button>
        )}
        </div>
      )}

      {!isAuthenticated && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg overflow-hidden border-none bg-transparent p-0 text-white backdrop-blur-3xl">
            <AuthForms initialTab="login" onSuccess={() => setOpen(false)} />
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
