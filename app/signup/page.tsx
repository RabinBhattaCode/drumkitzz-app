"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Button as GhostButton } from "@/components/ui/button"

const inputClasses =
  "h-11 rounded-2xl border-white/15 bg-white/5 text-white placeholder:text-white/60 focus-visible:ring-white/40"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      toast({ title: "Enter a valid email", description: "Please use a real email address.", variant: "destructive" })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Double-check your password confirmation.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, username, email, password }),
      })
      const text = await response.text()
      const payload = text ? (JSON.parse(text) as { error?: string }) : {}
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create account")
      }
      toast({ title: "Account created", description: "Welcome to DrumKitzz." })
      router.push("/home")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account"
      toast({ title: "Sign up failed", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-12">
      <Card className="w-full space-y-5 rounded-[32px] border border-white/15 bg-white/5/70 p-6 text-white shadow-[0_35px_90px_rgba(5,5,7,0.8)] backdrop-blur-2xl">
        <CardHeader className="items-center space-y-2 text-center text-white">
          <Image src="/images/drumkitzz-logo.png" alt="DrumKitzz" width={140} height={46} priority />
          <CardTitle className="text-2xl">Create your DrumKitzz account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0">
          <p className="text-center text-xs uppercase tracking-[0.35em] text-white/60">Continue with</p>
          <div className="grid grid-cols-3 gap-2">
            {["Google", "Apple", "Outlook"].map((provider) => (
              <GhostButton
                key={provider}
                type="button"
                variant="outline"
                className="h-10 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => toast({ title: `${provider} coming soon`, description: "Use email sign up for now." })}
              >
                {provider}
              </GhostButton>
            ))}
          </div>
          <div className="flex items-center gap-3 text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.3em]">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <CardContent className="space-y-3 p-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-white/70">
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-white/70">
                  Last name
                </Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClasses} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-white/70">
                Producer / username
              </Label>
              <Input
                id="username"
                placeholder="e.g. BeatSmith"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="artist@drumkitzz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClasses}
              />
            </div>
            <PasswordInput
              label="Password"
              id="signupPassword"
              value={password}
              onChange={setPassword}
              inputClassName={inputClasses}
            />
            <PasswordInput
              label="Confirm password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              inputClassName={inputClasses}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3 p-0">
            <Button
              type="submit"
              className="h-11 w-full rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:opacity-90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-l-black"></span>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            <p className="text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-white hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
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
      <Label htmlFor={id} className="text-white/70">
        {label}
      </Label>
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
          {showPassword ? "Hide" : "Show"}
          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
        </Button>
      </div>
    </div>
  )
}
