"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MailCheck, RefreshCw } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SignupCheckEmailPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border border-white/10 bg-white/5 text-white backdrop-blur-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <MailCheck className="h-7 w-7 text-amber-300" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="text-white/70">
            We sent a confirmation link to verify your account. Open it to finish signing up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-white/70">
            Didn&apos;t get it? Check your spam folder, or wait a minute—some providers delay delivery.
          </p>
          <div className="flex flex-col gap-2">
            <Button className="w-full rounded-full" variant="secondary" onClick={() => router.push("/auth/confirm")}>
              I already confirmed
            </Button>
            <Button className="w-full rounded-full" variant="ghost" onClick={() => router.push("/signup")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Use a different email
            </Button>
            <Link href="/" className="text-sm text-white/70 underline-offset-4 hover:underline">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
