"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthForms } from "@/app/components/auth/auth-forms"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full border border-white/15 bg-white/5/70 p-6 text-white shadow-[0_35px_90px_rgba(5,5,7,0.8)] backdrop-blur-2xl">
        <CardHeader className="items-center space-y-2 text-center">
          <Image src="/images/drumkitzz-logo.png" alt="DrumKitzz" width={140} height={46} priority />
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-white/70">Sign in to keep slicing on every device.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AuthForms
            initialTab="login"
            onSuccess={() => {
              router.push("/home")
            }}
            showHeader={false}
          />
        </CardContent>
        <div className="pt-4 text-center text-sm text-white/70">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-white hover:underline">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  )
}
