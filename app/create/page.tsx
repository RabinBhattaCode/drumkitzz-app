"use client"

import DrumSlicerPro from "@/components/create/drum-slicer-pro"
import { PricingPlans } from "@/components/pricing/pricing-plans"
import { useAuth } from "@/lib/auth-context"

export default function CreatePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-12">
      <DrumSlicerPro variant="classic" />
      {!isAuthenticated && (
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 lg:px-0">
          <PricingPlans />
        </div>
      )}
    </div>
  )
}
