import { NextRequest, NextResponse } from "next/server"

// Simple server-side proxy to fetch audio from remote URLs (e.g., Lalal.ai)
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const upstream = await fetch(url, { method: "GET" })

    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => "")
      console.error("proxy-audio upstream error", {
        url,
        status: upstream.status,
        statusText: upstream.statusText,
        body: bodyText?.slice(0, 500),
      })
      return NextResponse.json(
        {
          error: `Failed to fetch audio (${upstream.status})`,
          statusText: upstream.statusText,
          upstreamBody: bodyText?.slice(0, 500),
          url,
        },
        { status: 502 },
      )
    }

    // Stream the audio back with the same content type if available
    const contentType = upstream.headers.get("content-type") || "audio/mpeg"
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("proxy-audio error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: "Proxy fetch failed",
        details: errorMessage,
        url,
      },
      { status: 500 },
    )
  }
}
