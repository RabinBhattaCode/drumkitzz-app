import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const SaveLibrarySchema = z.object({
  projectId: z.string().uuid(),
  kitId: z.string().uuid().optional(), // if updating an existing kit
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  coverImagePath: z.string().optional(),
  status: z.enum(["draft", "processing", "ready", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
})

const deriveBucketFromAssetType = (assetType?: string | null) => {
  if (assetType === "stem") return "stems"
  if (assetType === "chop" || assetType === "preview") return "chops"
  return "stems"
}

export async function POST(req: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient()

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()
  if (authError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  // Ensure profile exists (FK on kits.owner_id)
  await supabase.from("profiles").upsert({ id: userId }).throwOnError()

  let payload: z.infer<typeof SaveLibrarySchema>
  try {
    payload = SaveLibrarySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { projectId, kitId, name, description, coverImagePath, status, visibility } = payload

  // Ensure project exists and belongs to user
  const { data: project, error: projectError } = await supabase
    .from("kit_projects")
    .select("id, owner_id, source_audio_path")
    .eq("id", projectId)
    .single()

  if (projectError || !project || project.owner_id !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Upsert kit
  const { data: kitRow, error: kitError } = await supabase
    .from("kits")
    .upsert(
      {
        id: kitId,
        owner_id: userId,
        project_id: projectId,
        name,
        description: description || null,
        cover_image_path: coverImagePath || null,
        status: status || "draft",
        visibility: visibility || "private",
      },
      { onConflict: "id" },
    )
    .select()
    .single()

  if (kitError || !kitRow) {
    return NextResponse.json({ error: kitError?.message || "Failed to save kit" }, { status: 500 })
  }

  // Copy any existing project assets into kit scope (owner/scope/file)
  const { data: projectAssets, error: assetsError } = await supabase
    .from("kit_assets")
    .select("id, storage_path, asset_type, size_bytes, metadata")
    .eq("project_id", projectId)
    .eq("owner_id", userId)

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message || "Failed to load project assets" }, { status: 500 })
  }

  const copiedAssets: any[] = []

  if (projectAssets && projectAssets.length > 0) {
    for (const asset of projectAssets) {
      const parts = asset.storage_path.split("/")
      if (parts.length < 3) continue // expect owner/scope/file
      const [owner, , ...rest] = parts
      const filename = rest.join("/")
      const newPath = [owner, kitRow.id, filename].join("/")
      const bucket = deriveBucketFromAssetType(asset.asset_type)

      // Attempt to copy; ignore if object already exists or copy fails
      await supabase.storage.from(bucket).copy(asset.storage_path, newPath)

      copiedAssets.push({
        owner_id: userId,
        kit_id: kitRow.id,
        project_id: projectId,
        asset_type: asset.asset_type,
        storage_path: newPath,
        size_bytes: asset.size_bytes,
        metadata: asset.metadata || {},
      })
    }

    if (copiedAssets.length > 0) {
      const { error: insertAssetsError } = await supabase.from("kit_assets").insert(copiedAssets)
      if (insertAssetsError) {
        return NextResponse.json({ error: insertAssetsError.message || "Failed to copy kit assets" }, { status: 500 })
      }
    }
  }

  // Fallback: if no assets yet, mirror project source into kit scope as original
  if ((!projectAssets || projectAssets.length === 0) && project.source_audio_path) {
    try {
      const response = await fetch(project.source_audio_path)
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer())
        const ext = project.source_audio_path.split(".").pop() || "mp3"
        const filename = `original-${Date.now()}.${ext}`
        const newPath = [userId, kitRow.id, filename].join("/")

        const { error: uploadError } = await supabase.storage.from("chops").upload(newPath, buffer, {
          contentType: "audio/mpeg",
          cacheControl: "3600",
          upsert: true,
        })
        if (!uploadError) {
          await supabase.from("kit_assets").insert({
            owner_id: userId,
            kit_id: kitRow.id,
            project_id: projectId,
            asset_type: "original",
            storage_path: newPath,
            size_bytes: buffer.length,
          })
        }
      }
    } catch (err) {
      console.warn("Fallback asset mirror skipped:", err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({ kitId: kitRow.id, kit: kitRow }, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient()
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()
  if (authError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  let payload: { kitId?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (!payload.kitId) {
    return NextResponse.json({ error: "kitId required" }, { status: 400 })
  }

  const { error } = await supabase.from("kits").delete().eq("id", payload.kitId).eq("owner_id", userId)
  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete kit" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
