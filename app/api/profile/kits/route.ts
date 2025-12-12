import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 })
  }

  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Kits owned by the user OR public kits that are published/ready
  const { data: kitRows, error: kitError } = await client
    .from("kits")
    .select(
      `
        id,name,description,cover_image_path,status,visibility,download_count,like_count,updated_at,created_at,price_cents,currency,bundle_path,owner_id,project_id
      `,
    )
    .or(`owner_id.eq.${userId},and(visibility.eq.public,status.in.(published,ready))`)
    .order("updated_at", { ascending: false })

  if (kitError) {
    return NextResponse.json({ error: kitError.message }, { status: 500 })
  }

  // Published/ready projects for this user
  const { data: projectRows, error: projectError } = await client
    .from("kit_projects")
    .select("id,title,status,updated_at,created_at,slice_settings,owner_id")
    .eq("owner_id", userId)
    .in("status", ["published", "ready"])
    .order("updated_at", { ascending: false })

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  return NextResponse.json({ kits: kitRows || [], projects: projectRows || [] })
}
