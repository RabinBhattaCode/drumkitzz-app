"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { SessionContextProvider, useSessionContext } from "@supabase/auth-helpers-react"
import { createBrowserClient } from "@/lib/supabase-browser"

interface UserProfile {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  backdrop?: string
}

interface AuthContext {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserClient())

  return <SessionContextProvider supabaseClient={supabaseClient}>{children}</SessionContextProvider>
}

export function useAuth(): AuthContext {
  const { session, isLoading, supabaseClient } = useSessionContext()

  const user = useMemo<UserProfile | null>(() => {
    if (!session?.user) return null

    const metadata = session.user.user_metadata as Record<string, any>
    const email = session.user.email ?? ""
    const usernameFromEmail = email ? email.split("@")[0] : session.user.id

    return {
      id: session.user.id,
      email,
      username: metadata?.username || usernameFromEmail,
      firstName: metadata?.first_name,
      lastName: metadata?.last_name,
      avatar: metadata?.avatar_url,
      backdrop: metadata?.backdrop_url,
    }
  }, [session])

  const login = async (email: string, password: string) => {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabaseClient.auth.signOut()
    if (error) {
      throw error
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }
}
