"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import {
  Bell,
  BookOpen,
  Box,
  Home,
  Menu,
  Music,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  LogOut,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type NavGroup = {
  type: "group"
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
  items: Array<{ label: string; href: string }>
}

type NavLink = {
  type: "link"
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
}

const mockCartItems = [
  { id: "1", name: "LA Trap Essentials", price: 24.99, creator: "beatmaker99" },
  { id: "2", name: "Lofi Chill Pack", price: 19.99, creator: "drumgod" },
]

const mockNotifications = [
  { id: "1", message: "beatlucid mentioned you in a drop", time: "Just now", read: false },
  { id: "2", message: "You sold 3 copies of 'Velvet Perc Pack'", time: "1h ago", read: false },
  { id: "3", message: "Sky @ramblebots started following you", time: "2h ago", read: true },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [showCartDialog, setShowCartDialog] = useState(false)
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false)
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [notifications, setNotifications] = useState(mockNotifications)

  const navConfig = useMemo<(NavLink | NavGroup)[]>(
    () => [
      { type: "link", title: "Home", icon: Home, href: "/home" },
      { type: "link", title: "Create", icon: Music, href: "/create?fresh=1" },
      { type: "link", title: "My Kits", icon: Box, href: "/my-projects" },
      { type: "link", title: "Market", icon: ShoppingBag, href: "/marketplace" },
      { type: "link", title: "Pricing", icon: DollarSign, href: "/pricing" },
      {
        type: "group",
        title: "About",
        icon: BookOpen,
        href: "/about",
        items: [
          { label: "About", href: "/about" },
          { label: "Help", href: "/help" },
          { label: "Guide", href: "/guide" },
        ],
      },
    ],
    [],
  )

  const protectedRoutes = useMemo(() => new Set(["/my-projects", "/my-kits", "/marketplace/stats"]), [])

  const handleProtectedClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isAuthenticated && protectedRoutes.has(href)) {
      event.preventDefault()
      window.dispatchEvent(new CustomEvent("open-auth-overlay", { detail: { mode: "login" } }))
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const removeFromCart = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((notes) => notes.map((note) => ({ ...note, read: true })))
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  const homeHref = isAuthenticated ? "/home" : "/marketing"

  const renderPrimaryLink = (link: NavLink) => {
    const Icon = link.icon
    const active = isActive(link.href)
    return (
      <Link key={link.href} href={link.href} onClick={(event) => handleProtectedClick(event, link.href)}>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
            active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span>{link.title}</span>
        </Button>
      </Link>
    )
  }

  const renderGroup = (group: NavGroup) => {
    const Icon = group.icon
    const active = [group.href, ...group.items.map((item) => item.href)].some((href) => isActive(href))
    return (
      <div key={group.title} className="space-y-2">
        <Link href={group.href} onClick={(event) => handleProtectedClick(event, group.href)}>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{group.title}</span>
          </Button>
        </Link>
        <div className="ml-8 flex flex-col gap-1">
          {group.items.map((item) => {
            const itemActive = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => handleProtectedClick(event, item.href)}
                className={`text-xs font-medium uppercase tracking-[0.2em] transition ${
                  itemActive ? "text-white" : "text-white/40 hover:text-white/80"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const DesktopNav = () => (
    <aside className="page-glow drumkitzz-sidebar hidden md:flex fixed left-0 top-0 z-50 h-screen w-52 flex-col border-r border-white/10 bg-[#050308]/85 px-4 pb-6 pt-5 backdrop-blur">
      <div className="flex items-center justify-center pb-6">
        <Link href={homeHref} className="flex items-center gap-2">
          <img
            src="https://ik.imagekit.io/flxhsxcsf/drumkitzz3.png?updatedAt=1762301071257"
            alt="DrumKitzz"
            width={96}
            height={32}
            className="object-contain"
          />
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4">
          {navConfig.map((section) => (section.type === "link" ? renderPrimaryLink(section) : renderGroup(section)))}
        </nav>
      </ScrollArea>
      <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/30 hover:bg-white/10">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      user?.avatar ||
                      "https://ik.imagekit.io/vv1coyjgq/ChatGPT%20Image%20Nov%2014,%202025,%2012_28_23%20AM.png?updatedAt=1763080146104"
                    }
                  />
                  <AvatarFallback className="bg-primary/30 text-primary-foreground">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-white">{user?.firstName}</p>
                  <p className="text-white/60">@{user?.username}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-52 bg-[#08040f] text-white">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex w-full items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/marketplace/stats" className="flex w-full items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Stats
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-300 focus:text-red-200">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )

  const MobileNav = () => (
    <nav className="marketing-mobile-nav md:hidden sticky top-0 z-50 border-b border-white/10 bg-[#050308]/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href={homeHref} className="flex items-center gap-2">
          <img
            src="https://ik.imagekit.io/flxhsxcsf/drumkitzz3.png?updatedAt=1762301071257"
            alt="DrumKitzz"
            width={96}
            height={32}
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setShowNotificationsDialog(true)}
              >
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px]">{unreadCount}</Badge>
                  )}
                </div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setShowCartDialog(true)}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px]">{cartItems.length}</Badge>
                  )}
                </div>
              </Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-white/10 bg-[#06030c] text-white">
                <div className="flex items-center justify-between pb-4">
                  <p className="text-sm uppercase tracking-[0.35em] text-white/50">Navigate</p>
                </div>
              <ScrollArea className="h-[calc(100vh-6rem)]">
                <nav className="flex flex-col gap-4">
                  {navConfig.map((section) => (section.type === "link" ? renderPrimaryLink(section) : renderGroup(section)))}
                </nav>
                <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                  {isAuthenticated && (
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full rounded-full border border-white/10 text-white/70 hover:bg-white/5"
                    >
                      Logout
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )

  return (
    <>
      <DesktopNav />
      <MobileNav />

      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="max-w-lg bg-[#08040f] text-white">
          <DialogHeader>
            <DialogTitle>Cart</DialogTitle>
            <DialogDescription className="text-white/60">Manage your selected kits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-sm text-white/60">Your cart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-white/60">by {item.creator}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>${item.price.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-md bg-[#08040f] text-white">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription className="text-white/60">Stay updated with your kits</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-center rounded-full border border-white/10 text-white/70" onClick={markAllAsRead}>
              Mark all as read
            </Button>
            {notifications.map((note) => (
              <div key={note.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm">{note.message}</p>
                <p className="text-xs text-white/50">{note.time}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}
