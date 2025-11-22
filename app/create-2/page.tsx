"use client"

import { Suspense } from "react"
import DrumSlicerPro from "@/components/create/drum-slicer-pro"

export default function CreateModernPage() {
  return (
    <Suspense fallback={<div className="text-white/60 p-4">Loading editor...</div>}>
      <DrumSlicerPro variant="modern" />
    </Suspense>
  )
}
