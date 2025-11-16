"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

type AuthFormsProps = {
  initialTab?: "login" | "signup"
  onSuccess?: () => void
}

const inputClasses =
  "h-11 rounded-2xl border-white/15 bg-white/5 text-white placeholder:text-white/60 focus-visible:ring-white/40"

export function AuthForms({ initialTab = "login", onSuccess }: AuthFormsProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab)
  const [loginLoading, setLoginLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [username, setUsername] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { login } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      await login(loginEmail, loginPassword)
      toast({ title: "Welcome back", description: "Signed in successfully." })
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in"
      toast({ title: "Sign in failed", description: message, variant: "destructive" })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Double-check your password confirmation.",
        variant: "destructive",
      })
      return
    }

    setSignupLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          firstName,
          lastName,
          username,
        }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create account")
      }

      await login(signupEmail, signupPassword)

      toast({
        title: "Account created",
        description: "You're all set—welcome to DrumKitzz!",
      })

      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account"
      toast({ title: "Sign up failed", description: message, variant: "destructive" })
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm space-y-5 rounded-[32px] border border-white/15 bg-white/5/90 p-6 text-white shadow-[0_35px_90px_rgba(5,5,7,0.8)] backdrop-blur-3xl">
      <CardHeader className="items-center space-y-2 text-center text-white">
        <Image src="/images/drumkitzz-logo.png" alt="DrumKitzz" width={120} height={40} priority />
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-white/70">Sign in to keep slicing on every device.</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin} className="space-y-4">
        <CardContent className="space-y-3 p-0">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/70">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="artist@drumkitzz.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <PasswordInput
            label="Password"
            id="password"
            value={loginPassword}
            onChange={(value) => setLoginPassword(value)}
            inputClassName={inputClasses}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-0">
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-white text-black hover:bg-white/90"
            disabled={loginLoading}
          >
            {loginLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
          <div className="flex flex-col gap-2 text-center text-sm text-white/70">
            <button type="button" className="underline-offset-4 hover:text-white">
              Forgot password?
            </button>
            <div>
              Need an account?{" "}
              <Link href="/signup" className="font-semibold text-white hover:underline">
                Sign up free
              </Link>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

function PasswordInput({
  label,
  id,
  value,
  onChange,
  inputClassName = "",
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  inputClassName?: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 text-white/70 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
        </Button>
      </div>
    </div>
  )
}
