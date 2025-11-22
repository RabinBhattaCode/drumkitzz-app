"use client"

import DrumSlicerPro from "@/components/create/drum-slicer-pro"
import { PricingPlans } from "@/components/pricing/pricing-plans"
import { useAuth } from "@/lib/auth-context"
import { Suspense } from "react"

export default function CreatePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-12">
      <Suspense fallback={<div className="text-white/60">Loading editor...</div>}>
        <DrumSlicerPro variant="classic" />
      </Suspense>
      {!isAuthenticated && (
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 lg:px-0">
          <PricingPlans />
        </div>
      )}
    </div>
  )
}
