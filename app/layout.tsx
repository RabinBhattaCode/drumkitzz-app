import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "DrumKitzz - Create and Share Drum Kits",
  description: "Professional drum kit creation and sharing platform",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
