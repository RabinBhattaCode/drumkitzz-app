import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const offset = Number(searchParams.get("offset") || 0)
  const limit = Number(searchParams.get("limit") || 12)
  const sort = searchParams.get("sort") || "recent" // recent | oldest | popular

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 })
  }

  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const orderClause =
    sort === "oldest"
      ? { column: "updated_at", ascending: true }
      : sort === "popular"
        ? { column: "like_count", ascending: false }
        : { column: "updated_at", ascending: false }

  const { data: kitRows, error } = await client
    .from("kits")
    .select(
      `
        id,
        name,
        description,
        cover_image_path,
        price_cents,
        currency,
        download_count,
        like_count,
        visibility,
        status,
        updated_at,
        project_id,
        owner:profiles!kits_owner_id(display_name, username)
      `,
    )
    .eq("visibility", "public")
    .in("status", ["published", "ready"])
    .order(orderClause.column as any, { ascending: orderClause.ascending, nullsFirst: false })
    .order("updated_at", { ascending: orderClause.ascending, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projectIds = kitRows?.map((k) => k.project_id).filter(Boolean) as string[]
  let projectTags: Record<string, string[]> = {}
  let projectsExtras: Record<string, { artwork?: string; priceCents?: number; currency?: string }> = {}

  if (projectIds.length > 0) {
    const { data: projectData } = await client
      .from("kit_projects")
      .select("id,slice_settings,owner:profiles!kit_projects_owner_id(display_name,username)")
      .in("id", projectIds)
    projectData?.forEach((proj) => {
      const settings = (proj.slice_settings || {}) as Record<string, any>
      const tagsSource = Array.isArray(settings.kitTags)
        ? settings.kitTags
        : Array.isArray(settings.tags)
          ? settings.tags
          : []
      projectTags[proj.id] = tagsSource
        .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .slice(0, 3)
      const price = settings.price
      projectsExtras[proj.id] = {
        artwork: settings.artwork,
        priceCents: Number.isFinite(price?.amountCents) ? price.amountCents : undefined,
        currency: price?.currency || undefined,
      }
    })
  }

  // Also fetch published/ready kit_projects (for users who only saved projects)
  const { data: projectRows } = await client
    .from("kit_projects")
    .select("id,title,status,updated_at,created_at,slice_settings,owner:profiles!kit_projects_owner_id(display_name,username)")
    .in("status", ["published", "ready"])
    .order(orderClause.column as any, { ascending: orderClause.ascending, nullsFirst: false })
    .order("updated_at", { ascending: orderClause.ascending, nullsFirst: false })
    .range(offset, offset + limit - 1)

  const payloadFromKits =
    (kitRows || []).map((row) => {
      const tags = row.project_id ? projectTags[row.project_id] || [] : []
      const priceOverride = row.project_id ? projectsExtras[row.project_id]?.priceCents : undefined
      const currencyOverride = row.project_id ? projectsExtras[row.project_id]?.currency : undefined
      const coverOverride = row.project_id ? projectsExtras[row.project_id]?.artwork : undefined
      const priceCents = Number.isFinite(priceOverride) ? priceOverride! : Number.isFinite(row.price_cents) ? row.price_cents : 0
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        cover: coverOverride || row.cover_image_path,
        priceCents,
        currency: currencyOverride || row.currency || "USD",
        downloads: row.download_count || 0,
        likes: row.like_count || 0,
        tags,
        owner: {
          name: row.owner?.display_name || row.owner?.username || "Producer",
          handle: row.owner?.username ? `@${row.owner.username}` : "@producer",
        },
        updatedAt: row.updated_at,
      }
    }) || []

  const payloadFromProjects =
    (projectRows || []).map((row) => {
      const settings = (row.slice_settings || {}) as Record<string, any>
      const tagsSource = Array.isArray(settings.kitTags)
        ? settings.kitTags
        : Array.isArray(settings.tags)
          ? settings.tags
          : []
      const tags = tagsSource
        .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .slice(0, 3)
      const price = settings.price
      const priceCents = Number.isFinite(price?.amountCents) ? price.amountCents : 0
      const currency = price?.currency || "USD"
      const cover = settings.artwork || settings.cover_image_path || "/placeholder.svg"
      return {
        id: `proj-${row.id}`,
        name: row.title || "Untitled Kit",
        description: settings.description || "",
        cover,
        priceCents,
        currency,
        downloads: 0,
        likes: 0,
        tags,
        owner: {
          name: row.owner?.display_name || row.owner?.username || "Producer",
          handle: row.owner?.username ? `@${row.owner.username}` : "@producer",
        },
        updatedAt: row.updated_at || row.created_at,
      }
    }) || []

  const combined = [...payloadFromKits, ...payloadFromProjects].sort((a, b) => {
    const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    if (sort === "oldest") return aDate - bDate
    if (sort === "popular") return (b.likes || 0) - (a.likes || 0)
    return bDate - aDate
  })

  return NextResponse.json({
    kits: combined.slice(0, limit),
    hasMore: combined.length > limit,
  })
}
