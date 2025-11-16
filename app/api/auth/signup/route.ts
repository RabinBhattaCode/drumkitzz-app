import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars", { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

  const { email, password, firstName, lastName, username } = (await request.json()) as {
    email?: string
    password?: string
    firstName?: string
    lastName?: string
    username?: string
  }

  if (!email || !password || !firstName || !lastName || !username) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const safeEmail = email.trim().toLowerCase()
  const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "")
  if (cleanedUsername.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters using letters, numbers, dots, or dashes" },
      { status: 400 },
    )
  }
  const asciiPasswordPattern = /^[\x20-\x7E]{6,72}$/
  if (!asciiPasswordPattern.test(password)) {
    return NextResponse.json(
      { error: "Password must be 6-72 ASCII characters (letters, numbers, and common symbols only)" },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: safeEmail,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name,
      username: cleanedUsername,
    },
  })

  if (error || !data.user) {
    console.error("Supabase admin createUser error", error)
    return NextResponse.json({ error: error?.message ?? "Unable to create account" }, { status: 400 })
  }

  await supabaseAdmin.from("profiles").upsert({
    id: data.user.id,
    username: cleanedUsername,
    display_name: `${firstName} ${lastName}`.trim(),
    avatar_url: null,
  })

  return NextResponse.json({ user: data.user })
}
