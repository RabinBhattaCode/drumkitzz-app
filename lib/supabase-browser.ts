"use client"

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/database.types"

/**
 * Creates a typed Supabase browser client that can be used inside Client Components.
 */
export function createBrowserClient() {
  return createPagesBrowserClient<Database>()
}
