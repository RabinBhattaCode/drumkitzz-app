"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface TrimWaveformProps {
  audioBuffer: AudioBuffer
  selection: [number, number]
  playbackTime?: number
  className?: string
  onSelectRange?: (range: [number, number]) => void
}

export function TrimWaveform({
  audioBuffer,
  selection,
  playbackTime,
  className,
  onSelectRange,
}: TrimWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const draggingRef = useRef<boolean>(false)
  const dragStartRef = useRef<number>(0)

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    ctx.clearRect(0, 0, width, height)

    const channelData = audioBuffer.getChannelData(0)
    const step = Math.max(1, Math.ceil(channelData.length / width))
    const amp = height / 2

    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, "rgba(245,217,122,0.85)")
    gradient.addColorStop(0.5, "rgba(163,119,255,0.7)")
    gradient.addColorStop(1, "rgba(110,163,255,0.8)")

    ctx.beginPath()
    ctx.moveTo(0, amp)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 1.6

    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0

      for (let j = 0; j < step; j++) {
        const index = i * step + j
        if (index < channelData.length) {
          const datum = channelData[index]
          if (datum < min) min = datum
          if (datum > max) max = datum
        }
      }

      ctx.lineTo(i, (1 + min) * amp)
      ctx.lineTo(i, (1 + max) * amp)
    }

    ctx.stroke()

    const [start, end] = selection
    const totalDuration = Math.max(audioBuffer.duration, 0.001)
    const startX = (start / totalDuration) * width
    const endX = (end / totalDuration) * width

    ctx.fillStyle = "rgba(245,217,122,0.25)"
    ctx.fillRect(startX, 0, Math.max(2, endX - startX), height)

    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.fillRect(startX - 1, 0, 2, height)
    ctx.fillRect(endX - 1, 0, 2, height)

    if (typeof playbackTime === "number") {
      const cursorX = (Math.max(0, Math.min(playbackTime, totalDuration)) / totalDuration) * width
      ctx.fillStyle = "rgba(245,217,122,0.95)"
      ctx.fillRect(cursorX - 0.5, 0, 1.5, height)
    }
  }, [audioBuffer, selection, playbackTime])

  const timeFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return 0
    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    return ratio * audioBuffer.duration
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onSelectRange) return
    draggingRef.current = true
    const startTime = timeFromEvent(event)
    dragStartRef.current = startTime
    onSelectRange([startTime, startTime])
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || !onSelectRange) return
    const current = timeFromEvent(event)
    onSelectRange([dragStartRef.current, current])
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || !onSelectRange) return
    const current = timeFromEvent(event)
    draggingRef.current = false
    onSelectRange([dragStartRef.current, current])
  }

  const handlePointerLeave = () => {
    draggingRef.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "w-full touch-none select-none rounded-2xl bg-gradient-to-b from-[#0e0b18] via-[#07050d] to-[#030308]",
        onSelectRange ? "cursor-crosshair" : "",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  )
}
