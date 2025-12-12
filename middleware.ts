import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/database.types"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Handle @username -> /profile/username rewrites
  if (pathname.startsWith("/@")) {
    const handle = pathname.slice(2) || ""
    if (handle) {
      const url = request.nextUrl.clone()
      url.pathname = `/profile/${handle}`
      return NextResponse.rewrite(url)
    }
  }

  // Clone the response
  const response = NextResponse.next()

  // Refresh Supabase session so auth state stays in sync
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })
  await supabase.auth.getSession()

  // Add security headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://i.ytimg.com https://www.gravatar.com https://ik.imagekit.io https://utfs.io;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.googleapis.com https://www.youtube.com https://*.supabase.co https://d.lalal.ai https://*.lalal.ai https://*.uploadthing.com https://uploadthing.com https://sea1.ingest.uploadthing.com;
    media-src 'self' blob: data: https://www.youtube.com https://d.lalal.ai https://*.lalal.ai;
    frame-src https://www.youtube.com;
  `
    .replace(/\s{2,}/g, " ")
    .trim()

  // Set security headers
  response.headers.set("Content-Security-Policy", cspHeader)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")

  // For API routes, add cache control headers
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, max-age=0")
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
