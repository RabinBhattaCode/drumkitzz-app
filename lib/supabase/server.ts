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
export function createServerSupabaseClient(): SupabaseClient<Database> {
  return createServerComponentClient<Database>({ cookies })
}

/**
 * Creates a Supabase client for route handlers / API routes where headers + cookies are available.
 */
export function createRouteHandlerSupabaseClient(): SupabaseClient<Database> {
  return createRouteHandlerClient<Database>({ cookies })
}
