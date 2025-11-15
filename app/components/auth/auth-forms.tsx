"use client"

import type React from "react"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

type AuthFormsProps = {
  initialTab?: "login" | "signup"
  onSuccess?: () => void
}

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
    <Card className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-3 pt-6">
        <Image src="/placeholder-logo.svg" alt="DrumKitzz" width={72} height={72} priority />
        <p className="text-sm text-muted-foreground">Join or sign in to the DrumKitzz community</p>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Sign in to your DrumKitzz account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <PasswordInput
                label="Password"
                id="password"
                value={loginPassword}
                onChange={(value) => setLoginPassword(value)}
              />
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <div className="mt-4 text-sm text-center text-muted-foreground">
                <a href="#" className="underline hover:text-primary">
                  Forgot password?
                </a>
              </div>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignup}>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Join the DrumKitzz community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Producer / username</Label>
                <Input
                  id="username"
                  placeholder="e.g. BeatSmith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupEmail">Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <PasswordInput
                label="Password"
                id="signupPassword"
                value={signupPassword}
                onChange={(value) => setSignupPassword(value)}
              />
              <PasswordInput
                label="Confirm password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(value) => setConfirmPassword(value)}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={signupLoading}>
                {signupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

function PasswordInput({
  label,
  id,
  value,
  onChange,
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
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
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
        </Button>
      </div>
    </div>
  )
}
