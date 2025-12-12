import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

export const runtime = "nodejs"

export async function GET(_req: Request, { params }: { params: { handle: string } }) {
  const rawHandle = params.handle || ""
  const handle = decodeURIComponent(rawHandle).replace(/^@/, "").trim()
  if (!handle) {
    return NextResponse.json({ error: "Handle required" }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 })
  }

  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try by username or display_name (case-insensitive)
  const { data, error } = await client
    .from("profiles")
    .select("id,username,display_name,bio,avatar_url,backdrop_url")
    .or(`username.ilike.${handle},display_name.ilike.${handle}`)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let profile = data

  // If not found, try matching by id (uuid)
  if (!profile && handle.length === 36) {
    const { data: byId, error: idErr } = await client
      .from("profiles")
      .select("id,username,display_name,bio,avatar_url,backdrop_url")
      .eq("id", handle)
      .maybeSingle()
    if (idErr) {
      return NextResponse.json({ error: idErr.message }, { status: 500 })
    }
    profile = byId
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Ensure a stable handle in the response for the client
  const handleValue = profile.username || profile.display_name || profile.id

  return NextResponse.json({ profile: { ...profile, handle: handleValue } })
}
