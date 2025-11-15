import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { LayoutShell } from "@/components/layout-shell"

export const metadata: Metadata = {
  title: "DrumKitzz - Create and Share Drum Kits",
  description: "Professional drum kit creation and sharing platform",
  generator: "v0.app",
  icons: {
    icon: "https://ik.imagekit.io/vv1coyjgq/drumkiitz%20favicon2.png?updatedAt=1763056413040",
  },
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
          <LayoutShell>{children}</LayoutShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
