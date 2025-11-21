"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSessionContext } from "@supabase/auth-helpers-react"
import { Loader2, MailCheck } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-white">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Finalizing your account…
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  )
}

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabaseClient } = useSessionContext()
  const { toast } = useToast()

  const [status, setStatus] = useState<"working" | "done" | "error">("working")
  const [message, setMessage] = useState("Confirming your email…")

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) {
      setStatus("error")
      setMessage("Missing confirmation code in the link.")
      return
    }

    const run = async () => {
      setStatus("working")
      setMessage("Finalizing your account…")
      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code)
      if (error || !data.session) {
        setStatus("error")
        setMessage(error?.message || "Unable to complete confirmation.")
        return
      }

      // Upsert profile with metadata if available (safe with RLS)
      const user = data.session.user
      const metadata = user.user_metadata as Record<string, any>
      const profilePayload = {
        id: user.id,
        username: metadata?.username || user.email?.split("@")[0] || user.id,
        display_name: `${metadata?.first_name ?? ""} ${metadata?.last_name ?? ""}`.trim() || metadata?.username,
        avatar_url: metadata?.avatar_url ?? null,
      }

      await supabaseClient.from("profiles").upsert(profilePayload)

      setStatus("done")
      setMessage("Email confirmed! Redirecting you to DrumKitzz…")
      toast({ title: "Email confirmed", description: "Welcome back!" })
      setTimeout(() => router.push("/home"), 1200)
    }

    void run()
  }, [router, searchParams, supabaseClient, toast])

  const iconColor = status === "error" ? "text-red-400" : "text-amber-300"

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-white/5 text-white backdrop-blur-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            {status === "working" ? (
              <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
            ) : (
              <MailCheck className={`h-6 w-6 ${iconColor}`} />
            )}
          </div>
          <CardTitle className="text-2xl">Confirming your account</CardTitle>
          <CardDescription className="text-white/70">{message}</CardDescription>
        </CardHeader>
        {status === "error" && (
          <CardContent className="space-y-3">
            <Button className="w-full rounded-full" onClick={() => router.push("/login")}>
              Go to login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
