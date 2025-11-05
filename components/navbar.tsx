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
import Image from "next/image"

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
    <>
      {/* Left Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-48 flex-col border-r bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/90 z-50">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="https://ik.imagekit.io/flxhsxcsf/drumkitzz3.png?updatedAt=1762301071257"
              alt="DrumKitzz"
              width={140}
              height={48}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-2 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 text-white hover:bg-gray-700 ${
                      isActive ? "bg-gray-700" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-base">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom section - User and actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-white hover:bg-gray-700"
                onClick={() => setShowNotificationsDialog(true)}
              >
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <span>Notifications</span>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-white hover:bg-gray-700"
                onClick={() => setShowCartDialog(true)}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {cartItems.length}
                    </Badge>
                  )}
                </div>
                <span>Cart</span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-gray-700 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                      <span className="text-xs text-gray-400">@{user?.username}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => setShowLoginDialog(true)} className="w-full bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <nav className="md:hidden sticky top-0 z-50 w-full border-b bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/90">
        <div className="container flex h-16 items-center justify-between">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="https://ik.imagekit.io/flxhsxcsf/drumkitzz3.png?updatedAt=1762301071257"
              alt="DrumKitzz"
              width={120}
              height={40}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotificationsDialog(true)}
                  className="text-white hover:bg-gray-700"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCartDialog(true)}
                  className="text-white hover:bg-gray-700"
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItems.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        {cartItems.length}
                      </Badge>
                    )}
                  </div>
                </Button>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-gray-800 border-gray-700">
                <div className="flex flex-col h-full">
                  <div className="py-4">
                    <Link href="/" className="block">
                      <Image
                        src="https://ik.imagekit.io/flxhsxcsf/drumkitzz3.png?updatedAt=1762301071257"
                        alt="DrumKitzz"
                        width={150}
                        height={50}
                        className="object-contain mx-auto"
                        priority
                        unoptimized
                      />
                    </Link>
                  </div>
                  <Separator className="bg-gray-700" />
                  <ScrollArea className="flex-1 py-4">
                    <nav className="flex flex-col gap-2">
                      {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                          <Link key={item.href} href={item.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className={`w-full justify-start gap-3 text-white hover:bg-gray-700 ${
                                isActive ? "bg-gray-700" : ""
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              {item.label}
                            </Button>
                          </Link>
                        )
                      })}
                    </nav>
                  </ScrollArea>

                  {isAuthenticated ? (
                    <div className="border-t border-gray-700 pt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-gray-700">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.firstName?.[0]}
                                {user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-sm">
                              <span className="font-medium">{user?.firstName}</span>
                              <span className="text-xs text-gray-400">@{user?.username}</span>
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>My Account</DropdownMenuLabel>
                          <DropdownMenuSeparator />
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
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <div className="border-t border-gray-700 pt-4">
                      <Button onClick={() => setShowLoginDialog(true)} className="w-full bg-primary hover:bg-primary/90">
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>Enter your email and password to sign in</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
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
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>
              {cartItems.length === 0 ? "Your cart is empty" : `${cartItems.length} item(s) in your cart`}
            </DialogDescription>
          </DialogHeader>
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="mb-3">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                        <Music className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">by {item.creator}</p>
                        <p className="text-sm font-bold mt-1">${item.price}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full">Proceed to Checkout</Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Start adding drum kits to your cart!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`mb-3 ${notification.read ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
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
