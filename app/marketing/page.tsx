"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { pricingTiers, currencyMeta, regionCurrencyMap } from "@/lib/pricing"
import { useAuth } from "@/lib/auth-context"

const builderScreenshot = "https://ik.imagekit.io/vv1coyjgq/Screenshot%202025-11-14%20at%2020.33.09.png?updatedAt=1763152418123"

const getRegionFromLanguage = (language: string) => {
  const region = language.split("-")[1]?.toUpperCase()
  return region && regionCurrencyMap[region] ? regionCurrencyMap[region] : "USD"
}

export default function MarketingLandingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [currency, setCurrency] = useState<keyof typeof currencyMeta>("USD")
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const builderRef = useRef<HTMLDivElement>(null)
  const workflowRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const affiliateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/home")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrency(getRegionFromLanguage(navigator.language || "en-US"))
    }
  }, [])

  useEffect(() => {
    document.body.classList.add("marketing-mode")
    return () => document.body.classList.remove("marketing-mode")
  }, [])

  const meta = currencyMeta[currency]
  const localizedTiers = useMemo(
    () =>
      pricingTiers.map((tier) => {
        const localizedPrice = tier.price === 0 ? 0 : Math.round(tier.price * meta.rate)
        return {
          ...tier,
          display: tier.price === 0 ? "Free" : `${meta.symbol}${localizedPrice}${meta.suffix}`,
        }
      }),
    [meta, currency],
  )

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="page-glow mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 lg:px-0">
      <header className="sticky top-4 z-20 mx-auto flex w-full max-w-4xl items-center justify-between rounded-full border border-white/10 bg-black/40 px-6 py-3 text-sm text-white shadow-lg backdrop-blur">
        <Link href="/marketing" className="flex items-center">
          <Image
            src="https://ik.imagekit.io/vv1coyjgq/drumkitzz3.png?updatedAt=1761581740540"
            alt="DrumKitzz"
            width={120}
            height={32}
            className="h-6 w-auto"
          />
        </Link>
        <nav className="hidden gap-6 md:flex">
          {[
            { label: "About", ref: heroRef },
            { label: "Features", ref: featuresRef },
            { label: "Workflow", ref: workflowRef },
            { label: "Pricing", ref: pricingRef },
            { label: "Contact", ref: contactRef },
            { label: "Affiliate", ref: affiliateRef },
          ].map((item) => (
            <button
              key={item.label}
              className="text-white/70 transition hover:text-white"
              onClick={() => item.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <Link href="/home">
          <Button className="rounded-full border border-white/30 bg-gradient-to-r from-white/15 to-white/5 text-white shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:bg-white/20">
            Slice for free
          </Button>
        </Link>
      </header>

      <section
        ref={heroRef}
        className="rounded-[40px] border border-white/10 bg-gradient-to-br from-[#050407] via-[#09060e] to-[#0d0a12] px-8 py-16 text-center shadow-[0_35px_120px_rgba(0,0,0,0.75)]"
      >
        <Button variant="outline" className="mx-auto mb-6 rounded-full border-white/20 bg-white/5 text-white/70">
          DrumKitzz
        </Button>
        <div className="space-y-6">
          <h1 className="font-display text-4xl text-white md:text-5xl">
            Slice like a pro. Publish in minutes. Own the drum drops everyone wants tomorrow.
          </h1>
          <p className="text-lg text-white/70">
            Drag stems, resample vinyl, or rip playlists. Auto-extract drums, clean them with AI, and push kits to the DrumKitzz marketplace or
            your vault.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/home">
              <Button className="rounded-full bg-amber-400 text-black hover:bg-amber-300">Get started – it’s free</Button>
            </Link>
            <Link href="/create">
              <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                See the builder
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <span className="flex h-3 w-3 rounded-full bg-white/60"></span>
            <span className="flex h-3 w-3 rounded-full bg-white/20"></span>
            <span className="flex h-3 w-3 rounded-full bg-white/20"></span>
            <span className="flex h-3 w-3 rounded-full bg-white/20"></span>
            <span>Join thousands of producers automating their kit workflow.</span>
          </div>
        </div>
      </section>

      <section ref={featuresRef} className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Kit-ready output",
            description: "Upload stems, vinyl chops, or voice memos. DrumKitzz slices and tags for marketplaces.",
          },
          {
            title: "Secure sharing",
            description: "Drop privately for collaborators, list publicly, or keep drafts inside your vault.",
          },
          {
            title: "AI acceleration",
            description: "Auto-extract drums, label metadata, and pre-render exports with zero manual trimming.",
          },
        ].map((feature) => (
          <div key={feature.title} className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-white">
            <p className="text-lg font-semibold">{feature.title}</p>
            <p className="mt-2 text-sm text-white/70">{feature.description}</p>
          </div>
        ))}
      </section>

      <section ref={builderRef} className="rounded-[32px] border border-white/10 bg-black/25 p-6 text-center">
        <Image
          src={builderScreenshot}
          alt="Inside the DrumKitzz builder"
          width={1200}
          height={700}
          className="mx-auto w-full max-w-4xl rounded-[32px] border border-white/10 object-cover shadow-[0_35px_100px_rgba(0,0,0,0.65)]"
        />
      </section>

      <section ref={workflowRef} className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Drag. Slice. Publish. Repeat.</p>
        <h2 className="mt-3 text-3xl font-semibold">A workflow tuned for beatmakers</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-white/80">• Drop audio from desktop, iCloud, or voice memos.</p>
            <p className="text-white/80">• Auto-extract stems or keep the mix for creative slicing.</p>
            <p className="text-white/80">• Export kits with metadata and push them straight to your store.</p>
            <p className="text-sm text-white/60">
              Need lossless results? Upload for maximum fidelity, record for sketches, or paste YouTube links for instant inspiration.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Testimonials</p>
            <h3 className="mt-3 text-xl font-semibold text-white">“I exported a sellable kit in 7 minutes.”</h3>
            <p className="mt-3 text-sm text-white/70">
              “No more guessing what to label each hit. DrumKitzz handles the grunt work so I spend time designing sounds.”
            </p>
            <p className="mt-4 text-xs text-white/60">— Mei Rivera, Perc Designer</p>
          </div>
        </div>
      </section>

      <section ref={pricingRef} className="space-y-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Pricing</p>
          <h2 className="font-display text-3xl text-white">Choose your plan</h2>
          <p className="text-white/70">Currency shown in {meta.label}, rounded to the nearest whole number.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {localizedTiers.map((tier) => (
            <div key={tier.id} className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{tier.name}</p>
                {tier.id === "creator" && <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-200">Popular</span>}
              </div>
              <p className="mt-2 text-sm text-white/60">{tier.description}</p>
              <p className="mt-6 text-3xl font-semibold">{tier.display}</p>
              <p className="text-sm text-white/60">{tier.perk}</p>
              <Button className="mt-6 w-full rounded-full bg-amber-400 text-black hover:bg-amber-300">
                {tier.id === "creator" ? "Selected" : "Choose plan"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section ref={contactRef} className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Contact</p>
        <h2 className="mt-3 text-3xl font-semibold">Talk to the DrumKitzz team</h2>
        <p className="mt-2 text-white/70">
          Need a bespoke workflow or an enterprise plan? Drop us a line and we’ll respond within 24 hours.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="rounded-3xl border border-white/10 bg-black/30 px-5 py-3">Email: hello@drumkitzz.com</div>
          <div className="rounded-3xl border border-white/10 bg-black/30 px-5 py-3">Discord: @drumkitzz</div>
          <div className="rounded-3xl border border-white/10 bg-black/30 px-5 py-3">Office hours: Mon–Fri · 10am–6pm GMT</div>
        </div>
      </section>

      <section ref={affiliateRef} className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Affiliate</p>
        <h2 className="mt-3 text-3xl font-semibold">Earn with DrumKitzz</h2>
        <p className="mt-2 text-white/70">
          Share DrumKitzz with your community and get paid for every kit-maker who subscribes. Receive unique referral links, dashboards, and
          monthly payouts.
        </p>
        <Button className="mt-6 rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20">Apply to the affiliate program</Button>
      </section>

      <footer className="rounded-[32px] border border-white/10 bg-black/30 p-8 text-white">
        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr,1fr]">
          <div className="space-y-3">
            <Link href="/marketing" className="flex items-center gap-2 text-white">
              <Image src="https://ik.imagekit.io/vv1coyjgq/drumkitzz3.png?updatedAt=1761581740540" alt="DrumKitzz" width={120} height={32} className="h-6 w-auto" />
            </Link>
            <p className="text-white/70">Crafting the future of drum kits.</p>
            <div className="flex gap-4 text-white/60">
              <Link href="https://instagram.com">Instagram</Link>
              <Link href="https://twitter.com">X</Link>
              <Link href="https://linkedin.com">LinkedIn</Link>
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">Menu</p>
            <div className="mt-3 flex flex-col gap-2 text-white/70">
              <Link href="/marketing">Home</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/help">Contact</Link>
              <Link href="/guide">Partner</Link>
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">Studio</p>
            <div className="mt-3 flex flex-col gap-2 text-white/70">
              <Link href="/about">Blog</Link>
              <Link href="/guide">Affiliate</Link>
              <Link href="/guide">Affiliate ToS</Link>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
          © {new Date().getFullYear()} DrumKitzz. All rights reserved. · Terms · Privacy · DMCA
        </div>
      </footer>
    </div>
  )
}
