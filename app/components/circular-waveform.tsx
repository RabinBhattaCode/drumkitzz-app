"use client"

import { useEffect, useRef, useState } from "react"

interface CircularWaveformProps {
  audioBuffer: AudioBuffer
  slices: Array<{
    id: string
    start: number
    end: number
    type: string
  }>
  potentialSlices: Array<number>
  currentTime: number
  onSliceClick: (sliceId: string) => void
  onMarkerDrag: (sliceId: string, type: "start" | "end", position: number, isDoubleClick?: boolean) => void
  onWaveformClick: (position: number, isDoubleClick: boolean) => void
  onWaveformMouseUp: (position: number) => void
  selectedSliceId?: string | null
}

const slicePalette: Record<string, string> = {
  kick: "#f5d97a",
  snare: "#8ec5ff",
  hat: "#7ee0c2",
  tom: "#ff9f43",
  cymb: "#c7a0ff",
  perc: "#ff87b3",
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "")
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function CircularWaveform({
  audioBuffer,
  slices,
  potentialSlices,
  currentTime,
  onSliceClick,
  onMarkerDrag,
  onWaveformClick,
  onWaveformMouseUp,
  selectedSliceId,
}: CircularWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const [activeHandle, setActiveHandle] = useState<{ sliceId: string; type: "start" | "end" } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setSize(Math.min(rect.width, rect.height))
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer || size === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const center = size / 2
    const baseRadius = size * 0.28
    const maxRadius = size * 0.42

    ctx.clearRect(0, 0, size, size)

    // background ring
    ctx.beginPath()
    ctx.arc(center, center, maxRadius + 6, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(255,255,255,0.08)"
    ctx.lineWidth = 12
    ctx.stroke()

    drawRadialWave(ctx, center, baseRadius, maxRadius)
    drawSlices(ctx, center, baseRadius, maxRadius)
    drawPotentialSlices(ctx, center, baseRadius, maxRadius)
    drawPlayhead(ctx, center, baseRadius, maxRadius)
  }, [audioBuffer, size, slices, potentialSlices, currentTime, selectedSliceId])

  const polarFromClient = (clientX: number, clientY: number) => {
    if (!canvasRef.current || size === 0) return { angle: 0, time: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const dx = x - size / 2
    const dy = y - size / 2
    let theta = Math.atan2(dy, dx)
    if (theta < 0) theta += Math.PI * 2
    // convert so 0 is at top and increases clockwise
    const angle = (Math.PI / 2 - theta + Math.PI * 2) % (Math.PI * 2)
    const time = (angle / (Math.PI * 2)) * audioBuffer.duration
    return { angle, time }
  }

  const drawRadialWave = (
    ctx: CanvasRenderingContext2D,
    center: number,
    baseRadius: number,
    maxRadius: number,
  ) => {
    const data = audioBuffer.getChannelData(0)
    const steps = Math.min(2048, data.length)
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      const sampleIndex = Math.floor((i / steps) * data.length)
      const sample = data[sampleIndex] || 0
      const radius = baseRadius + Math.abs(sample) * (maxRadius - baseRadius)
      const x = center + radius * Math.sin(angle)
      const y = center - radius * Math.cos(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    const gradient = ctx.createRadialGradient(center, center, baseRadius * 0.6, center, center, maxRadius)
    gradient.addColorStop(0, "rgba(245, 217, 122, 0.2)")
    gradient.addColorStop(1, "rgba(179, 122, 9, 0.6)")
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.shadowColor = "rgba(245,217,122,0.35)"
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  const drawSlices = (
    ctx: CanvasRenderingContext2D,
    center: number,
    baseRadius: number,
    maxRadius: number,
  ) => {
    const radius = (baseRadius + maxRadius) / 2
    slices.forEach((slice) => {
      const startAngle = (slice.start / audioBuffer.duration) * Math.PI * 2
      const endAngle = (slice.end / audioBuffer.duration) * Math.PI * 2
      const color = slicePalette[slice.type] || slicePalette.kick
      ctx.beginPath()
      ctx.strokeStyle = hexToRgba(color, slice.id === selectedSliceId ? 0.9 : 0.5)
      ctx.lineWidth = slice.id === selectedSliceId ? 10 : 6
      ctx.arc(center, center, radius, -startAngle + Math.PI / 2, -endAngle + Math.PI / 2, true)
      ctx.stroke()

      // handles
      drawHandle(ctx, center, radius, startAngle, color)
      drawHandle(ctx, center, radius, endAngle, color)
    })
  }

  const drawHandle = (
    ctx: CanvasRenderingContext2D,
    center: number,
    radius: number,
    angle: number,
    color: string,
  ) => {
    const x = center + radius * Math.sin(angle)
    const y = center - radius * Math.cos(angle)
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.strokeStyle = "#0b0d12"
    ctx.lineWidth = 2
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  const drawPotentialSlices = (
    ctx: CanvasRenderingContext2D,
    center: number,
    baseRadius: number,
    maxRadius: number,
  ) => {
    const radius = maxRadius + 4
    ctx.strokeStyle = "rgba(255,255,255,0.12)"
    ctx.lineWidth = 2
    potentialSlices.forEach((pos) => {
      const angle = (pos / audioBuffer.duration) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(center, center, radius, -angle + Math.PI / 2 - 0.01, -angle + Math.PI / 2 + 0.01, true)
      ctx.stroke()
    })
  }

  const drawPlayhead = (
    ctx: CanvasRenderingContext2D,
    center: number,
    baseRadius: number,
    maxRadius: number,
  ) => {
    const angle = (currentTime / audioBuffer.duration) * Math.PI * 2
    const outer = maxRadius + 8
    const inner = baseRadius - 12
    const x1 = center + inner * Math.sin(angle)
    const y1 = center - inner * Math.cos(angle)
    const x2 = center + outer * Math.sin(angle)
    const y2 = center - outer * Math.cos(angle)

    ctx.strokeStyle = "#f5d97a"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  const handlePointerDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const { angle, time } = polarFromClient(event.clientX, event.clientY)

    const handleHit = findHandleAtAngle(angle)
    if (handleHit) {
      setActiveHandle(handleHit)
      onSliceClick(handleHit.sliceId)
      return
    }

    onWaveformClick(time, event.detail === 2)
  }

  const handlePointerMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeHandle) return
    event.preventDefault()
    const { time } = polarFromClient(event.clientX, event.clientY)
    onMarkerDrag(activeHandle.sliceId, activeHandle.type, Math.max(0, Math.min(audioBuffer.duration, time)))
  }

  const handlePointerUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { time } = polarFromClient(event.clientX, event.clientY)
    onWaveformMouseUp(Math.max(0, Math.min(audioBuffer.duration, time)))
    setActiveHandle(null)
  }

  const findHandleAtAngle = (angle: number) => {
    const threshold = 0.07 // radians
    for (const slice of slices) {
      const startAngle = (slice.start / audioBuffer.duration) * Math.PI * 2
      const endAngle = (slice.end / audioBuffer.duration) * Math.PI * 2
      if (angularDistance(angle, startAngle) < threshold) {
        return { sliceId: slice.id, type: "start" as const }
      }
      if (angularDistance(angle, endAngle) < threshold) {
        return { sliceId: slice.id, type: "end" as const }
      }
    }
    return null
  }

  const angularDistance = (a: number, b: number) => {
    let diff = Math.abs(a - b)
    diff = Math.min(diff, Math.PI * 2 - diff)
    return diff
  }

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => setActiveHandle(null)}
      />
    </div>
  )
}
