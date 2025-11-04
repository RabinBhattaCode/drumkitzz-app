"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface KnobProps {
  value: number
  min: number
  max: number
  step?: number
  size?: number
  className?: string
  trackColor?: string
  activeColor?: string
  onChange: (value: number) => void
}

export function Knob({
  value,
  min,
  max,
  step = 1,
  size = 20,
  className,
  trackColor = "#e5e7eb",
  activeColor = "#3b82f6",
  onChange,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startValue, setStartValue] = useState(0)

  // Calculate the angle based on the current value
  const angle = ((value - min) / (max - min)) * 270 - 135

  // Handle mouse/touch down
  const handleStart = (clientY: number) => {
    setIsDragging(true)
    setStartY(clientY)
    setStartValue(value)

    // Prevent text selection during dragging
    document.body.style.userSelect = "none"
  }

  // Handle mouse/touch move
  const handleMove = (clientY: number) => {
    if (!isDragging) return

    // Calculate the change in Y position
    const deltaY = startY - clientY

    // Convert the delta to a value change (more movement = bigger change)
    // Adjust sensitivity here
    const sensitivity = (max - min) / 200
    const newValue = Math.min(max, Math.max(min, startValue + deltaY * sensitivity))

    // Round to the nearest step
    const steppedValue = Math.round(newValue / step) * step

    // Check if onChange is a function before calling it
    if (typeof onChange === "function") {
      onChange(steppedValue)
    } else {
      console.warn("Knob component: onChange prop is not a function")
    }
  }

  // Handle mouse/touch up
  const handleEnd = () => {
    setIsDragging(false)

    // Re-enable text selection
    document.body.style.userSelect = ""
  }

  // Add event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY)
    const handleMouseUp = () => handleEnd()
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY)
    const handleTouchEnd = () => handleEnd()

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, startY, startValue, min, max, step, onChange])

  // Prevent default on touch to avoid scrolling while adjusting
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (knobRef.current?.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: false })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
    }
  }, [])

  // Calculate the center and radius
  const center = size / 2
  const radius = size / 2 - 2

  // Calculate the position of the indicator line
  const indicatorX = center + Math.cos((angle * Math.PI) / 180) * (radius - 4)
  const indicatorY = center + Math.sin((angle * Math.PI) / 180) * (radius - 4)

  return (
    <div
      ref={knobRef}
      className={cn("relative cursor-pointer select-none touch-none", className)}
      style={{ width: size, height: size }}
      onMouseDown={(e) => handleStart(e.clientY)}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth="2"
          strokeDasharray={`${Math.PI * radius * 0.75} ${Math.PI * radius * 0.25}`}
          transform={`rotate(-135 ${center} ${center})`}
        />

        {/* Active arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={activeColor}
          strokeWidth="2"
          strokeDasharray={`${Math.PI * radius * 0.75 * ((value - min) / (max - min))} ${Math.PI * radius * 2}`}
          transform={`rotate(-135 ${center} ${center})`}
        />

        {/* Indicator line */}
        <line
          x1={center}
          y1={center}
          x2={indicatorX}
          y2={indicatorY}
          stroke={activeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={center} cy={center} r="3" fill={activeColor} />
      </svg>
    </div>
  )
}
