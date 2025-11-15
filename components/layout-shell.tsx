"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import { SignInOverlay } from "@/components/sign-in-overlay"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMarketingRoute = pathname === "/" || pathname?.startsWith("/marketing")

  if (isMarketingRoute) {
    return <main>{children}</main>
  }

  return (
    <>
      <Navbar />
      <SignInOverlay />
      <main className="pt-16 md:pt-0 md:pl-52">{children}</main>
    </>
  )
}
