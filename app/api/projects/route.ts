import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// Basic schema for project save. Extend as your UI evolves.
const SaveProjectSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  sourceAudioPath: z.string().optional(),
  sourceDuration: z.number().optional(),
  sliceSettings: z.any().optional(), // JSON blob of slicer state
  playbackConfig: z.any().optional(),
  fxChains: z.any().optional(),
  notes: z.string().optional(),
  slices: z
    .array(
      z.object({
        id: z.string().optional(), // allow non-uuid ids from client; DB will generate if missing
        name: z.string().optional(),
        type: z.string().optional(),
        start_time: z.number(),
        end_time: z.number(),
        fade_in_ms: z.number().optional(),
        fade_out_ms: z.number().optional(),
        metadata: z.any().optional(),
      }),
    )
    .optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient()

  // Auth
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()
  if (authError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  // Ensure profile exists (FK on kit_projects.owner_id)
  await supabase.from("profiles").upsert({ id: userId }).throwOnError()

  let payload: z.infer<typeof SaveProjectSchema>
  try {
    payload = SaveProjectSchema.parse(await req.json())
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? `Invalid payload: ${err.issues.map((i) => i.path.join(".") + " " + i.message).join(", ")}`
        : "Invalid payload"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const {
    projectId,
    title,
    sourceAudioPath,
    sourceDuration,
    sliceSettings,
    playbackConfig,
    fxChains,
    notes,
    slices,
  } = payload

  const isUuid = (value?: string | null) =>
    !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  // Upsert project
  const { data: projectRow, error: projectError } = await supabase
    .from("kit_projects")
    .upsert(
      {
        id: projectId,
        owner_id: userId,
        title,
        source_audio_path: sourceAudioPath || null,
        source_duration: sourceDuration || null,
        slice_settings: sliceSettings || {},
        playback_config: playbackConfig || {},
        fx_chains: fxChains || {},
        notes: notes || null,
      },
      { onConflict: "id" },
    )
    .select()
    .single()

  if (projectError || !projectRow) {
    return NextResponse.json(
      { error: projectError?.message || "Failed to save project", details: projectError?.details },
      { status: 500 },
    )
  }

  const finalProjectId = projectRow.id

  // Upsert slices if provided
  if (slices && slices.length > 0) {
    const slicesWithId = slices.filter((s) => isUuid(s.id))
    const slicesWithoutId = slices.filter((s) => !isUuid(s.id))

    // Insert slices without id (let DB generate)
    if (slicesWithoutId.length > 0) {
      const inserts = slicesWithoutId.map((s) => ({
        project_id: finalProjectId,
        name: s.name || null,
        type: s.type || null,
        start_time: s.start_time,
        end_time: s.end_time,
        fade_in_ms: s.fade_in_ms ?? 0,
        fade_out_ms: s.fade_out_ms ?? 0,
        metadata: s.metadata || {},
        created_at: new Date().toISOString(),
      }))
      const { error: insertError } = await supabase.from("kit_slices").insert(inserts)
      if (insertError) {
        return NextResponse.json(
          { error: insertError.message || "Failed to save slices", details: insertError.details },
          { status: 500 },
        )
      }
    }

    // Upsert slices with valid ids
    if (slicesWithId.length > 0) {
      const upserts = slicesWithId.map((s) => ({
        id: s.id,
        project_id: finalProjectId,
        name: s.name || null,
        type: s.type || null,
        start_time: s.start_time,
        end_time: s.end_time,
        fade_in_ms: s.fade_in_ms ?? 0,
        fade_out_ms: s.fade_out_ms ?? 0,
        metadata: s.metadata || {},
        created_at: new Date().toISOString(),
      }))
      const { error: upsertError } = await supabase.from("kit_slices").upsert(upserts, { onConflict: "id" })
      if (upsertError) {
        return NextResponse.json(
          { error: upsertError.message || "Failed to save slices", details: upsertError.details },
          { status: 500 },
        )
      }
    }
  }

  return NextResponse.json({ projectId: finalProjectId, project: projectRow }, { status: 200 })
}

export async function GET(req: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  if (authError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId") || url.searchParams.get("id")

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 })
  }

  const { data: project, error: projectError } = await supabase
    .from("kit_projects")
    .select(
      `
        id,
        owner_id,
        title,
        source_audio_path,
        source_duration,
        slice_settings,
        playback_config,
        fx_chains,
        notes,
        status,
        linked_kit_id,
        kit_slices (
          id,
          project_id,
          kit_id,
          name,
          type,
          start_time,
          end_time,
          fade_in_ms,
          fade_out_ms,
          metadata,
          created_at
        )
      `,
    )
    .eq("id", projectId)
    .eq("owner_id", userId)
    .single()

  if (projectError || !project) {
    const status = projectError?.code === "PGRST116" ? 404 : 500
    return NextResponse.json(
      { error: projectError?.message || "Project not found" },
      { status },
    )
  }

  // Load project assets and sign URLs for convenience (best-effort)
  const bucketForAsset = (assetType?: string | null) => {
    if (assetType === "stem") return "stems"
    if (assetType === "preview") return "stems"
    if (assetType === "original") return "chops"
    return "chops"
  }

  const assets: Array<{
    id: string
    asset_type: string | null
    storage_path: string
    signedUrl?: string
  }> = []

  const { data: assetRows } = await supabase
    .from("kit_assets")
    .select("id, asset_type, storage_path")
    .eq("project_id", projectId)
    .eq("owner_id", userId)

  if (assetRows && assetRows.length > 0) {
    for (const a of assetRows) {
      const bucket = bucketForAsset(a.asset_type)
      try {
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(a.storage_path, 60 * 60)
        assets.push({ ...a, signedUrl: signed?.signedUrl })
      } catch {
        assets.push({ ...a })
      }
    }
  }

  return NextResponse.json({ project, assets }, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  let body: { projectId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const projectId = body.projectId
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 })
  }

  const { error } = await supabase.from("kit_projects").delete().eq("id", projectId).eq("owner_id", userId)
  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete project" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
