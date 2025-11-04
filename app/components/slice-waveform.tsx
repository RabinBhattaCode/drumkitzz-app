"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface SliceWaveformProps {
  audioBuffer: AudioBuffer
  start: number
  end: number
  fadeIn: number
  fadeOut: number
  fadeInShape: number // 0 = linear, 1 = full S-curve, -1 = inverse S-curve
  fadeOutShape: number // 0 = linear, 1 = full S-curve, -1 = inverse S-curve
  type: string
  zoomLevel: number
  scrollPosition?: number
  onStartChange?: (newStart: number) => void
  onEndChange?: (newEnd: number) => void
  onZoomChange?: (newZoom: number) => void
  onScrollChange?: (newScroll: number) => void
  onFadeInShapeChange?: (newShape: number) => void
  onFadeOutShapeChange?: (newShape: number) => void
}

export function SliceWaveform({
  audioBuffer,
  start,
  end,
  fadeIn,
  fadeOut,
  fadeInShape = 0,
  fadeOutShape = 0,
  type,
  zoomLevel = 1,
  scrollPosition = 0.5,
  onStartChange,
  onEndChange,
  onZoomChange,
  onScrollChange,
  onFadeInShapeChange,
  onFadeOutShapeChange,
}: SliceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  // Add these state variables after the existing useState declarations
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)
  const [isDraggingFadeInShape, setIsDraggingFadeInShape] = useState(false)
  const [isDraggingFadeOutShape, setIsDraggingFadeOutShape] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const [initialStart, setInitialStart] = useState(0)
  const [initialEnd, setInitialEnd] = useState(0)
  const [initialFadeInShape, setInitialFadeInShape] = useState(0)
  const [initialFadeOutShape, setInitialFadeOutShape] = useState(0)

  // Add state for boundary knobs
  const [isDraggingStartKnob, setIsDraggingStartKnob] = useState(false)
  const [isDraggingEndKnob, setIsDraggingEndKnob] = useState(false)

  // Draw waveform when component mounts or props change
  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Calculate visible portion of audio based on zoom and scroll
    const sliceDuration = end - start
    const visibleDuration = sliceDuration / zoomLevel
    const startOffset = scrollPosition * (sliceDuration - visibleDuration)
    const visibleStart = start + startOffset
    const visibleEnd = Math.min(end, visibleStart + visibleDuration)

    // Calculate sample indices
    const startSample = Math.floor(visibleStart * audioBuffer.sampleRate)
    const endSample = Math.floor(visibleEnd * audioBuffer.sampleRate)
    const totalSamples = endSample - startSample

    // Get audio data
    const data = audioBuffer.getChannelData(0).slice(startSample, endSample)

    // Draw waveform
    drawWaveform(ctx, rect.width, rect.height, data, getColorForType(type))

    // Draw fade in/out visualizations with S-curves
    drawFades(
      ctx,
      rect.width,
      rect.height,
      fadeIn,
      fadeOut,
      fadeInShape,
      fadeOutShape,
      visibleStart,
      visibleEnd,
      start,
      end,
    )

    // Draw boundary knobs
    drawBoundaryKnobs(ctx, rect.width, rect.height)
  }, [audioBuffer, start, end, fadeIn, fadeOut, fadeInShape, fadeOutShape, type, zoomLevel, scrollPosition])

  // Draw waveform
  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: Float32Array,
    color: string,
  ) => {
    const step = Math.ceil(data.length / width)
    const amp = height / 2

    ctx.beginPath()
    ctx.moveTo(0, amp)

    // Draw the waveform
    ctx.strokeStyle = color
    ctx.lineWidth = 2

    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0

      for (let j = 0; j < step; j++) {
        const index = i * step + j
        if (index < data.length) {
          const datum = data[index]
          if (datum < min) min = datum
          if (datum > max) max = datum
        }
      }

      ctx.lineTo(i, (1 + min) * amp)
      ctx.lineTo(i, (1 + max) * amp)
    }

    ctx.stroke()
  }

  // Helper function to calculate S-curve value
  const calculateSCurve = (x: number, shapeParameter: number): number => {
    // Ensure x is between 0 and 1
    x = Math.max(0, Math.min(1, x))

    // If shape parameter is 0, return linear fade
    if (shapeParameter === 0) return x

    // Apply S-curve with adjustable shape
    // Using a cubic bezier curve approximation
    const t = x
    const cp1x = 0.5 - shapeParameter * 0.5 // First control point x
    const cp1y = 0 // First control point y
    const cp2x = 0.5 + shapeParameter * 0.5 // Second control point x
    const cp2y = 1 // Second control point y

    // Cubic Bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
    // Where P₀ = (0,0), P₁ = (cp1x,cp1y), P₂ = (cp2x,cp2y), P₃ = (1,1)
    // We only need the y-value
    const y = 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3)

    return y
  }

  // Draw fade in/out visualizations with S-curves and adjustable shape
  const drawFades = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fadeIn: number,
    fadeOut: number,
    fadeInShape: number,
    fadeOutShape: number,
    visibleStart: number,
    visibleEnd: number,
    sliceStart: number,
    sliceEnd: number,
  ) => {
    const visibleDuration = visibleEnd - visibleStart

    // Calculate fade positions in the visible window
    const fadeInEndTime = sliceStart + fadeIn / 1000
    const fadeOutStartTime = sliceEnd - fadeOut / 1000

    // Only draw fade in if it's in the visible range
    if (fadeIn > 0 && visibleStart <= fadeInEndTime) {
      const fadeInEndX = Math.min(width, ((fadeInEndTime - visibleStart) / visibleDuration) * width)

      ctx.fillStyle = "rgba(59, 130, 246, 0.2)" // Blue with transparency
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(fadeInEndX, 0)
      ctx.lineTo(fadeInEndX, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()

      // Fade in curve with S-shape
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, height)

      // Draw S-curve for fade in
      for (let i = 0; i <= fadeInEndX; i++) {
        const progress = i / fadeInEndX
        const sCurveValue = calculateSCurve(progress, fadeInShape)
        ctx.lineTo(i, height - sCurveValue * height)
      }
      ctx.stroke()

      // Draw fade in shape control handle directly under the fade line
      if (fadeIn > 0) {
        const handleX = fadeInEndX / 2

        // Draw vertical guide line
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)"
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(handleX, 0)
        ctx.lineTo(handleX, height)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw knob at the bottom
        ctx.fillStyle = "rgba(59, 130, 246, 0.8)"
        ctx.beginPath()
        ctx.arc(handleX, height - 10, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Only draw fade out if it's in the visible range
    if (fadeOut > 0 && visibleEnd >= fadeOutStartTime) {
      const fadeOutStartX = Math.max(0, ((fadeOutStartTime - visibleStart) / visibleDuration) * width)

      ctx.fillStyle = "rgba(239, 68, 68, 0.2)" // Red with transparency
      ctx.beginPath()
      ctx.moveTo(fadeOutStartX, 0)
      ctx.lineTo(width, 0)
      ctx.lineTo(width, height)
      ctx.lineTo(fadeOutStartX, height)
      ctx.closePath()
      ctx.fill()

      // Fade out curve with mirrored S-shape
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fadeOutStartX, 0)

      // Draw mirrored S-curve for fade out
      for (let i = 0; i <= width - fadeOutStartX; i++) {
        const progress = i / (width - fadeOutStartX)
        const sCurveValue = calculateSCurve(progress, fadeOutShape)
        ctx.lineTo(fadeOutStartX + i, sCurveValue * height)
      }
      ctx.stroke()

      // Draw fade out shape control handle directly under the fade line
      if (fadeOut > 0) {
        const handleX = fadeOutStartX + (width - fadeOutStartX) / 2

        // Draw vertical guide line
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(handleX, 0)
        ctx.lineTo(handleX, height)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw knob at the bottom
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)"
        ctx.beginPath()
        ctx.arc(handleX, height - 10, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }

  // Draw boundary knobs at 1/4 and 3/4 positions
  const drawBoundaryKnobs = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Left boundary knob (start) at 1/4 position
    const leftKnobX = Math.floor(width * 0.25)

    // Draw vertical line for left boundary
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(leftKnobX, 0)
    ctx.lineTo(leftKnobX, height - 16)
    ctx.stroke()

    // Draw knob under the vertical line
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)" // Blue
    ctx.beginPath()
    ctx.arc(leftKnobX, height - 10, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1
    ctx.stroke()

    // Right boundary knob (end) at 3/4 position
    const rightKnobX = Math.floor(width * 0.75)

    // Draw vertical line for right boundary
    ctx.strokeStyle = "rgba(239, 68, 68, 0.6)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(rightKnobX, 0)
    ctx.lineTo(rightKnobX, height - 16)
    ctx.stroke()

    // Draw knob under the vertical line
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)" // Red
    ctx.beginPath()
    ctx.arc(rightKnobX, height - 10, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Get color for slice type
  const getColorForType = (type: string): string => {
    switch (type) {
      case "kick":
        return "#ef4444"
      case "snare":
        return "#3b82f6"
      case "hat":
        return "#10b981"
      case "tom":
        return "#f59e0b"
      case "cymb":
        return "#8b5cf6"
      default:
        return "#a855f7"
    }
  }

  // Handle click on the waveform
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onStartChange || !onEndChange) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height
    const handleSize = 8

    const duration = end - start
    const sampleRate = audioBuffer.sampleRate
    const timeStep = 0.01 // 10ms adjustment
  }

  // Add handlers for dragging to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height

    // Calculate handle positions
    const leftHandleX = Math.floor(width * 0.25)
    const rightHandleX = Math.floor(width * 0.75)
    const handleHitArea = 10 // Slightly larger than visual width for easier clicking

    // Calculate fade shape control positions
    const sliceDuration = end - start
    const visibleDuration = sliceDuration / zoomLevel
    const startOffset = scrollPosition * (sliceDuration - visibleDuration)
    const visibleStart = start + startOffset
    const visibleEnd = Math.min(end, visibleStart + visibleDuration)

    const fadeInEndTime = start + fadeIn / 1000
    const fadeOutStartTime = end - fadeOut / 1000

    const fadeInEndX = ((fadeInEndTime - visibleStart) / (visibleEnd - visibleStart)) * width
    const fadeOutStartX = ((fadeOutStartTime - visibleStart) / (visibleEnd - visibleStart)) * width

    const fadeInHandleX = fadeInEndX / 2
    const fadeOutHandleX = fadeOutStartX + (width - fadeOutStartX) / 2
    const fadeHandleHitArea = 10

    // Check if near the bottom of the waveform (where knobs are)
    if (y > height - 20) {
      // Check if clicking on the left boundary knob
      if (Math.abs(x - leftHandleX) <= handleHitArea) {
        setIsDraggingStartKnob(true)
        setDragStartX(e.clientX)
        setInitialStart(start)
        e.preventDefault()
        return
      }

      // Check if clicking on the right boundary knob
      if (Math.abs(x - rightHandleX) <= handleHitArea) {
        setIsDraggingEndKnob(true)
        setDragStartX(e.clientX)
        setInitialEnd(end)
        e.preventDefault()
        return
      }

      // Check if clicking on the fade in shape control knob
      if (
        fadeIn > 0 &&
        Math.abs(x - fadeInHandleX) <= fadeHandleHitArea &&
        fadeInHandleX > 0 &&
        fadeInHandleX < width
      ) {
        setIsDraggingFadeInShape(true)
        setDragStartX(e.clientX)
        setDragStartY(e.clientY)
        setInitialFadeInShape(fadeInShape)
        e.preventDefault()
        return
      }

      // Check if clicking on the fade out shape control knob
      if (
        fadeOut > 0 &&
        Math.abs(x - fadeOutHandleX) <= fadeHandleHitArea &&
        fadeOutHandleX > 0 &&
        fadeOutHandleX < width
      ) {
        setIsDraggingFadeOutShape(true)
        setDragStartX(e.clientX)
        setDragStartY(e.clientY)
        setInitialFadeOutShape(fadeOutShape)
        e.preventDefault()
        return
      }
    } else {
      // Check if clicking on the left handle (start boundary) vertical line
      if (Math.abs(x - leftHandleX) <= handleHitArea) {
        setIsDraggingStart(true)
        setDragStartX(e.clientX)
        setInitialStart(start)
        e.preventDefault()
        return
      }

      // Check if clicking on the right handle (end boundary) vertical line
      if (Math.abs(x - rightHandleX) <= handleHitArea) {
        setIsDraggingEnd(true)
        setDragStartX(e.clientX)
        setInitialEnd(end)
        e.preventDefault()
        return
      }
    }

    // Otherwise, handle normal dragging for scrolling
    setIsDragging(true)
    setDragStartX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !audioBuffer) return

    const rect = canvasRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    if (isDraggingFadeInShape && onFadeInShapeChange) {
      // Calculate how much the mouse has moved vertically
      const deltaY = dragStartY - e.clientY

      // Convert pixel movement to shape parameter (-1 to 1)
      // Moving up increases the shape parameter (more curved)
      // Moving down decreases the shape parameter (more linear or inverse curved)
      const shapeChange = deltaY / (height / 2) // Scale to reasonable range

      // Calculate new shape parameter
      const newShape = Math.max(-1, Math.min(1, initialFadeInShape + shapeChange))

      // Update the shape parameter
      onFadeInShapeChange(newShape)

      // Update cursor
      canvasRef.current.style.cursor = "ns-resize"
    } else if (isDraggingFadeOutShape && onFadeOutShapeChange) {
      // Calculate how much the mouse has moved vertically
      const deltaY = dragStartY - e.clientY

      // Convert pixel movement to shape parameter (-1 to 1)
      const shapeChange = deltaY / (height / 2) // Scale to reasonable range

      // Calculate new shape parameter
      const newShape = Math.max(-1, Math.min(1, initialFadeOutShape + shapeChange))

      // Update the shape parameter
      onFadeOutShapeChange(newShape)

      // Update cursor
      canvasRef.current.style.cursor = "ns-resize"
    } else if ((isDraggingStart || isDraggingStartKnob) && onStartChange) {
      // Calculate how much the mouse has moved
      const deltaX = e.clientX - dragStartX

      // Convert pixel movement to time
      const visibleDuration = (end - start) / zoomLevel
      const timeDelta = (deltaX / rect.width) * visibleDuration

      // Calculate new start time
      const newStart = Math.max(0, Math.min(end - 0.01, initialStart + timeDelta))

      // Update the start time
      onStartChange(newStart)

      // Update cursor
      canvasRef.current.style.cursor = "ew-resize"
    } else if ((isDraggingEnd || isDraggingEndKnob) && onEndChange) {
      // Calculate how much the mouse has moved
      const deltaX = e.clientX - dragStartX

      // Convert pixel movement to time
      const visibleDuration = (end - start) / zoomLevel
      const timeDelta = (deltaX / rect.width) * visibleDuration

      // Calculate new end time
      const newEnd = Math.max(start + 0.01, Math.min(audioBuffer.duration, initialEnd + timeDelta))

      // Update the end time
      onEndChange(newEnd)

      // Update cursor
      canvasRef.current.style.cursor = "ew-resize"
    } else if (isDragging && onScrollChange) {
      // Handle normal dragging for scrolling
      const deltaX = e.clientX - dragStartX
      const deltaRatio = deltaX / rect.width

      // Calculate new scroll position (invert direction for natural scrolling)
      const newScroll = Math.max(0, Math.min(1, scrollPosition - deltaRatio / zoomLevel))
      onScrollChange(newScroll)
      setDragStartX(e.clientX)
    } else {
      // Update cursor based on mouse position when not dragging
      if (canvasRef.current) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Calculate handle positions
        const leftHandleX = Math.floor(width * 0.25)
        const rightHandleX = Math.floor(width * 0.75)
        const handleHitArea = 10

        // Calculate fade shape control positions
        const sliceDuration = end - start
        const visibleDuration = sliceDuration / zoomLevel
        const startOffset = scrollPosition * (sliceDuration - visibleDuration)
        const visibleStart = start + startOffset
        const visibleEnd = Math.min(end, visibleStart + visibleDuration)

        const fadeInEndTime = start + fadeIn / 1000
        const fadeOutStartTime = end - fadeOut / 1000

        const fadeInEndX = ((fadeInEndTime - visibleStart) / (visibleEnd - visibleStart)) * width
        const fadeOutStartX = ((fadeOutStartTime - visibleStart) / (visibleEnd - visibleStart)) * width

        const fadeInHandleX = fadeInEndX / 2
        const fadeOutHandleX = fadeOutStartX + (width - fadeOutStartX) / 2
        const fadeHandleHitArea = 10

        // Check if near the bottom of the waveform (where knobs are)
        if (y > height - 20) {
          if (Math.abs(x - leftHandleX) <= handleHitArea || Math.abs(x - rightHandleX) <= handleHitArea) {
            canvasRef.current.style.cursor = "ew-resize"
          } else if (
            (fadeIn > 0 &&
              Math.abs(x - fadeInHandleX) <= fadeHandleHitArea &&
              fadeInHandleX > 0 &&
              fadeInHandleX < width) ||
            (fadeOut > 0 &&
              Math.abs(x - fadeOutHandleX) <= fadeHandleHitArea &&
              fadeOutHandleX > 0 &&
              fadeOutHandleX < width)
          ) {
            canvasRef.current.style.cursor = "ns-resize"
          } else {
            canvasRef.current.style.cursor = "grab"
          }
        } else if (Math.abs(x - leftHandleX) <= handleHitArea || Math.abs(x - rightHandleX) <= handleHitArea) {
          canvasRef.current.style.cursor = "ew-resize"
        } else {
          canvasRef.current.style.cursor = "grab"
        }
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDraggingStart(false)
    setIsDraggingEnd(false)
    setIsDraggingFadeInShape(false)
    setIsDraggingFadeOutShape(false)
    setIsDraggingStartKnob(false)
    setIsDraggingEndKnob(false)

    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
    }
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setIsDraggingStart(false)
    setIsDraggingEnd(false)
    setIsDraggingFadeInShape(false)
    setIsDraggingFadeOutShape(false)
    setIsDraggingStartKnob(false)
    setIsDraggingEndKnob(false)

    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
    }
  }

  // Add wheel handler for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl/cmd + wheel
      if (onZoomChange) {
        const zoomDelta = e.deltaY * 0.01
        const newZoom = Math.max(1, Math.min(20, zoomLevel - zoomDelta))
        onZoomChange(newZoom)
      }
    } else if (onScrollChange) {
      // Horizontal scroll with wheel
      const scrollMultiplier = e.deltaMode === 0 ? 0.0005 : 0.001
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
      const newScroll = Math.max(0, Math.min(1, scrollPosition + delta * scrollMultiplier))
      onScrollChange(newScroll)
    }
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        title="Drag knobs to adjust fade curves and slice boundaries"
      />
    </div>
  )
}
