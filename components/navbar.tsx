"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { Menu, Music, TrendingUp, ShoppingBag, User, Settings, LogOut, Bell, ShoppingCart, Box, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock cart items
const mockCartItems = [
  {
    id: "1",
    name: "LA Trap Essentials",
    price: 24.99,
    creator: "beatmaker99",
    image: "/trap-drums.png",
  },
  {
    id: "2",
    name: "Lofi Chill Pack",
    price: 19.99,
    creator: "drumgod",
    image: "/lofi-drums.png",
  },
]

// Mock notifications
const mockNotifications = [
  {
    id: "1",
    type: "like",
    message: "beatmaker99 liked your kit 'Sunset Drums'",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "comment",
    message: "drumgod commented on 'Urban Beats'",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "follow",
    message: "rhythmmaster started following you",
    time: "1 day ago",
    read: true,
  },
  {
    id: "4",
    type: "purchase",
    message: "Your kit 'Sunset Drums' was purchased",
    time: "2 days ago",
    read: true,
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, login, logout } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showCartDialog, setShowCartDialog] = useState(false)
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [notifications, setNotifications] = useState(mockNotifications)

  const navItems = [
    { href: "/", label: "Create", icon: Music },
    { href: "/my-kits", label: "My Kits", icon: Box },
    { href: "/marketplace", label: "Market", icon: ShoppingBag },
    { href: "/charts", label: "Charts", icon: TrendingUp },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
    setShowLoginDialog(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Music className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>DrumKitzz</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "secondary" : "ghost"} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Right side - Auth and actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Shopping Cart */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowCartDialog(true)}>
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.username} />
                      <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/my-kits")}>
                    <Music className="mr-2 h-4 w-4" />
                    My Kits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => setShowLoginDialog(true)}>Log In</Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log In to DrumKitzz</DialogTitle>
            <DialogDescription>Enter any email and password to access your account</DialogDescription>
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

      {/* Shopping Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>
              {cartItems.length === 0 ? "Your cart is empty" : `${cartItems.length} items in your cart`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-20 h-20 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">by {item.creator}</p>
                        <p className="font-bold mt-1">${item.price}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          {cartItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
            <DialogDescription>
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {notification.type === "like" && <span className="text-2xl">❤️</span>}
                          {notification.type === "comment" && <span className="text-2xl">💬</span>}
                          {notification.type === "follow" && <span className="text-2xl">👤</span>}
                          {notification.type === "purchase" && <span className="text-2xl">💰</span>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default" className="ml-2">
                            New
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
