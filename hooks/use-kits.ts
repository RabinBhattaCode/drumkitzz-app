"use client"

import { useCallback, useEffect, useState } from "react"
import { deleteDrumKit, getDrumKits, saveDrumKit, type DrumKit } from "@/lib/dashboard-data"

export function useKits() {
  const [kits, setKits] = useState<DrumKit[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return
    const data = getDrumKits()
    setKits(data)
  }, [])

  useEffect(() => {
    refresh()
    setIsLoaded(true)
  }, [refresh])

  const upsertKit = useCallback(
    (kit: DrumKit) => {
      saveDrumKit(kit)
      refresh()
    },
    [refresh],
  )

  const removeKit = useCallback(
    (id: string) => {
      deleteDrumKit(id)
      refresh()
    },
    [refresh],
  )

  return {
    kits,
    isLoaded,
    upsertKit,
    removeKit,
    refresh,
  }
}
