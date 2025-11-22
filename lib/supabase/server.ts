"use server"

import { cookies } from "next/headers"
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

/**
 * Creates a Supabase client that can be safely used inside Server Components.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

/**
 * Creates a Supabase client for route handlers / API routes where headers + cookies are available.
 */
export async function createRouteHandlerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
}
