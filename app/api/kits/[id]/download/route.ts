import { NextResponse, type NextRequest } from "next/server"
import JSZip from "jszip"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

export const runtime = "nodejs"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const kitId = params.id
  if (!kitId) return NextResponse.json({ error: "kitId required" }, { status: 400 })

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase service role not configured" }, { status: 500 })
  }

  // Service role client to read storage
  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // We also need the caller's session to ensure ownership
  const authClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: sessionData, error: authError } = await authClient.auth.getSession()
  if (authError || !sessionData.session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = sessionData.session.user.id

  // Fetch kit assets (owned by user)
  const { data: assets, error: assetsError } = await serviceClient
    .from("kit_assets")
    .select("storage_path, asset_type")
    .eq("kit_id", kitId)
    .eq("owner_id", userId)

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message || "Failed to load assets" }, { status: 500 })
  }

  if (!assets || assets.length === 0) {
    return NextResponse.json({ error: "No assets found for this kit" }, { status: 404 })
  }

  const zip = new JSZip()

  for (const asset of assets) {
    // Determine bucket from asset_type
    const bucket =
      asset.asset_type === "stem" ? "stems" : asset.asset_type === "preview" ? "stems" : asset.asset_type === "original" ? "raw-audio" : "chops"
    const { data: download, error: downloadError } = await serviceClient.storage.from(bucket).download(asset.storage_path)
    if (downloadError || !download) {
      console.warn("Failed to download asset", asset.storage_path, downloadError?.message)
      continue
    }

    const arrayBuffer = await download.arrayBuffer()
    const fileName = asset.storage_path.split("/").slice(-1)[0]
    // Keep extension; caller expects WAV but source is MP3. For now we zip the source; transcode can be added later.
    zip.file(fileName, arrayBuffer)
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="kit-${kitId}.zip"`,
    },
  })
}
