"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

// Add onZoomChange to the props interface
interface WaveformProps {
  audioBuffer: AudioBuffer
  slices: Array<{
    id: string
    start: number
    end: number
    type: string
  }>
  potentialSlices: Array<number>
  currentTime: number
  zoomLevel: number
  scrollPosition: number
  onScrollChange: (position: number) => void
  onZoomChange?: (zoom: number) => void
  onSliceClick: (sliceId: string) => void
  onMarkerDrag: (sliceId: string, type: "start" | "end", position: number, isDoubleClick?: boolean) => void
  onWaveformClick: (position: number, isDoubleClick: boolean) => void
  onWaveformMouseUp: (position: number) => void
  isCreatingSlice: boolean
  newSliceStart: number | null
  selectedSliceId?: string | null
}

export function Waveform({
  audioBuffer,
  slices,
  potentialSlices,
  currentTime,
  zoomLevel: propsZoomLevel,
  scrollPosition,
  onScrollChange,
  onSliceClick,
  onMarkerDrag,
  onWaveformClick,
  onWaveformMouseUp,
  isCreatingSlice,
  newSliceStart,
  onZoomChange,
  selectedSliceId,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [initialScroll, setInitialScroll] = useState(0)
  const [activeMarker, setActiveMarker] = useState<{ sliceId: string; type: "start" | "end" } | null>(null)
  const [mousePosition, setMousePosition] = useState<number | null>(null)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  // Add these new state variables to the component
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false)
  const [scrollbarDragStart, setScrollbarDragStart] = useState<{ x: number; thumbPos: number } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(propsZoomLevel || 1)
  const [isDocumentListenersAttached, setIsDocumentListenersAttached] = useState(false)
  const [documentListenersAttached, setDocumentListenersAttached] = useState(false)
  const [isDocumentMouseMoveListenerActive, setIsDocumentMouseMoveListenerActive] = useState(false)
  const [isDocumentMouseUpListenerActive, setIsDocumentMouseUpListenerActive] = useState(false)
  const [lastZoomTime, setLastZoomTime] = useState(0)

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
    const visibleDuration = audioBuffer.duration / zoomLevel
    const startTime = scrollPosition * (audioBuffer.duration - visibleDuration)
    const endTime = startTime + visibleDuration

    // Draw background grid
    drawGrid(ctx, rect.width, rect.height, startTime, endTime)

    // Draw waveform
    drawWaveform(ctx, rect.width, rect.height, startTime, endTime)

    // Draw potential slices
    drawPotentialSlices(ctx, rect.width, rect.height, startTime, endTime)

    // Draw slices
    drawSlices(ctx, rect.width, rect.height, startTime, endTime)

    // Draw new slice being created
    if (isCreatingSlice && newSliceStart !== null && mousePosition !== null) {
      drawNewSlice(ctx, rect.width, rect.height, startTime, endTime, newSliceStart, mousePosition)
    }

    // Draw playhead
    if (currentTime >= startTime && currentTime <= endTime) {
      const playheadX = ((currentTime - startTime) / (endTime - startTime)) * rect.width
      drawPlayhead(ctx, playheadX, rect.height)
    }
  }, [
    audioBuffer,
    slices,
    potentialSlices,
    currentTime,
    zoomLevel,
    scrollPosition,
    isCreatingSlice,
    newSliceStart,
    mousePosition,
    selectedSliceId,
  ])

  // Prevent browser scrolling when mouse is over waveform
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    // Add event listener with passive: false to allow preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      window.removeEventListener("wheel", handleWheel)
    }
  }, [])

  // Draw background grid
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
  ) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Vertical grid lines (time markers)
    const duration = endTime - startTime
    const secondsPerLine = getGridInterval(duration)

    // Find the first grid line
    const firstLineTime = Math.ceil(startTime / secondsPerLine) * secondsPerLine

    for (let time = firstLineTime; time <= endTime; time += secondsPerLine) {
      const x = ((time - startTime) / duration) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      // Add time label
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(time.toFixed(1) + "s", x, height - 5)
    }

    // Horizontal grid lines (amplitude markers)
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  // Determine appropriate grid interval based on visible duration
  const getGridInterval = (duration: number): number => {
    if (duration <= 0.5) return 0.05
    if (duration <= 1) return 0.1
    if (duration <= 5) return 0.5
    if (duration <= 10) return 1
    if (duration <= 30) return 5
    if (duration <= 60) return 10
    return 30
  }

  // Draw waveform with enhanced peaks
  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
  ) => {
    const data = audioBuffer.getChannelData(0)
    const amp = height / 2

    // Calculate samples per pixel
    const startSample = Math.floor(startTime * audioBuffer.sampleRate)
    const endSample = Math.floor(endTime * audioBuffer.sampleRate)
    const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / width))

    ctx.beginPath()
    ctx.moveTo(0, amp)
    ctx.strokeStyle = "#0ea5e9"
    ctx.lineWidth = 1.5

    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0

      const sampleOffset = startSample + i * samplesPerPixel

      for (let j = 0; j < samplesPerPixel; j++) {
        const sampleIndex = sampleOffset + j
        if (sampleIndex < data.length) {
          const sample = data[sampleIndex]
          if (sample < min) min = sample
          if (sample > max) max = sample
        }
      }

      // Enhance peaks for better visibility when zoomed in
      if (zoomLevel > 2) {
        min *= 1.2
        max *= 1.2
      }

      // Clamp values
      min = Math.max(-1, Math.min(1, min))
      max = Math.max(-1, Math.min(1, max))

      ctx.lineTo(i, (1 + min) * amp)
      ctx.lineTo(i, (1 + max) * amp)
    }

    ctx.stroke()
  }

  // Draw potential slices (gray markers)
  const drawPotentialSlices = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
  ) => {
    const duration = endTime - startTime

    potentialSlices.forEach((position) => {
      // Check if position is visible in current view
      if (position >= startTime && position <= endTime) {
        const x = ((position - startTime) / duration) * width

        // Draw potential slice marker (gray line)
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"
        ctx.lineWidth = 1
        ctx.setLineDash([4, 2])

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()

        ctx.setLineDash([])
      }
    })
  }

  // Draw new slice being created
  const drawNewSlice = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
    sliceStart: number,
    sliceEnd: number,
  ) => {
    const duration = endTime - startTime

    // Check if slice is visible in current view
    if ((sliceStart >= startTime && sliceStart <= endTime) || (sliceEnd >= startTime && sliceEnd <= endTime)) {
      const startX = Math.max(0, ((sliceStart - startTime) / duration) * width)
      const endX = Math.min(width, ((sliceEnd - startTime) / duration) * width)

      // Draw slice background
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)" // Blue with transparency
      ctx.fillRect(startX, 0, endX - startX, height)

      // Draw slice borders
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      // Start marker
      if (sliceStart >= startTime) {
        ctx.beginPath()
        ctx.moveTo(startX, 0)
        ctx.lineTo(startX, height)
        ctx.stroke()
      }

      // End marker
      if (sliceEnd <= endTime) {
        ctx.beginPath()
        ctx.moveTo(endX, 0)
        ctx.lineTo(endX, height)
        ctx.stroke()
      }

      ctx.setLineDash([])
    }
  }

  // Draw slices with draggable markers
  const drawSlices = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
  ) => {
    const duration = endTime - startTime

    // Only draw slices that are visible in the current view
    const visibleSlices = slices.filter((slice) => slice.end >= startTime && slice.start <= endTime)

    // Sort slices by size (smallest first) to ensure larger slices don't cover smaller ones
    visibleSlices.sort((a, b) => b.end - b.start - (a.end - a.start))

    visibleSlices.forEach((slice) => {
      const startX = Math.max(0, ((slice.start - startTime) / duration) * width)
      const endX = Math.min(width, ((slice.end - startTime) / duration) * width)

      // Skip drawing if the slice would be too small to see
      if (endX - startX < 1) return

      // Determine if this is the selected slice
      const isSelected = slice.id === selectedSliceId

      // Draw slice background with higher opacity if selected
      ctx.fillStyle = getSliceColor(slice.type, isSelected ? 0.4 : 0.2)
      ctx.fillRect(startX, 0, endX - startX, height)

      // Draw slice borders with handles
      const handleRadius = isSelected ? 7 : 6 // Slightly larger handle for selected slice
      const handleColor = getSliceColor(slice.type, 1)

      // Start marker
      if (slice.start >= startTime) {
        // Line
        ctx.strokeStyle = handleColor
        ctx.lineWidth = isSelected ? 3 : 2 // Thicker line for selected slice
        ctx.beginPath()
        ctx.moveTo(startX, 0)
        ctx.lineTo(startX, height)
        ctx.stroke()

        // Handle
        ctx.fillStyle = handleColor
        ctx.beginPath()
        ctx.arc(startX, height - 15, handleRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // End marker
      if (slice.end <= endTime) {
        // Line
        ctx.strokeStyle = handleColor
        ctx.lineWidth = isSelected ? 3 : 2 // Thicker line for selected slice
        ctx.beginPath()
        ctx.moveTo(endX, 0)
        ctx.lineTo(endX, height)
        ctx.stroke()

        // Handle
        ctx.fillStyle = handleColor
        ctx.beginPath()
        ctx.arc(endX, height - 15, handleRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw slice label if there's enough space
      if (endX - startX > 40) {
        ctx.fillStyle = "white"
        ctx.font = isSelected ? "bold 11px sans-serif" : "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(slice.type, (startX + endX) / 2, 15)
      }

      // Add a "play" icon in the middle if selected
      if (isSelected && endX - startX > 20) {
        // Draw play triangle
        const centerX = (startX + endX) / 2
        const centerY = height / 2
        const triangleSize = Math.min(12, (endX - startX) / 4)

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.beginPath()
        ctx.moveTo(centerX - triangleSize / 2, centerY - triangleSize)
        ctx.lineTo(centerX - triangleSize / 2, centerY + triangleSize)
        ctx.lineTo(centerX + triangleSize, centerY)
        ctx.closePath()
        ctx.fill()
      }
    })
  }

  // Draw playhead
  const drawPlayhead = (ctx: CanvasRenderingContext2D, x: number, height: number) => {
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Draw playhead handle
    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(x, 10, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Get color for slice type
  const getSliceColor = (type: string, alpha: number): string => {
    const colors: Record<string, string> = {
      kick: `rgba(239, 68, 68, ${alpha})`, // red
      snare: `rgba(59, 130, 246, ${alpha})`, // blue
      hat: `rgba(16, 185, 129, ${alpha})`, // green
      tom: `rgba(245, 158, 11, ${alpha})`, // amber
      cymb: `rgba(139, 92, 246, ${alpha})`, // purple
      perc: `rgba(168, 85, 247, ${alpha})`, // fuchsia
    }

    return colors[type] || `rgba(168, 85, 247, ${alpha})`
  }

  // Find if a marker is at the given position
  const findMarkerAtPosition = (x: number, y: number): { sliceId: string; type: "start" | "end" } | null => {
    if (!canvasRef.current || !audioBuffer) return null

    const rect = canvasRef.current.getBoundingClientRect()
    const visibleDuration = audioBuffer.duration / zoomLevel
    const startTime = scrollPosition * (audioBuffer.duration - visibleDuration)
    const endTime = startTime + visibleDuration
    const duration = endTime - startTime
    const handleRadius = 8 // Slightly larger than visual radius for easier clicking

    // Check if we're near the bottom of the waveform where handles are
    if (y < rect.height - 30 || y > rect.height) return null

    // Check each slice
    for (const slice of slices) {
      if (slice.end >= startTime && slice.start <= endTime) {
        // Check start marker
        if (slice.start >= startTime) {
          const startX = ((slice.start - startTime) / duration) * rect.width
          if (Math.abs(x - startX) <= handleRadius) {
            return { sliceId: slice.id, type: "start" }
          }
        }

        // Check end marker
        if (slice.end <= endTime) {
          const endX = ((slice.end - startTime) / duration) * rect.width
          if (Math.abs(x - endX) <= handleRadius) {
            return { sliceId: slice.id, type: "end" }
          }
        }
      }
    }

    return null
  }

  // Convert mouse position to audio time
  const getTimeFromMousePosition = (x: number): number => {
    if (!canvasRef.current || !audioBuffer) return 0

    const rect = canvasRef.current.getBoundingClientRect()
    const visibleDuration = audioBuffer.duration / zoomLevel
    const startTime = scrollPosition * (audioBuffer.duration - visibleDuration)
    const clickRatio = x / rect.width
    return startTime + clickRatio * visibleDuration
  }

  // Add a new function to find if a click is within a slice's boundaries
  const findSliceAtPosition = (x: number): string | null => {
    if (!canvasRef.current || !audioBuffer) return null

    const rect = canvasRef.current.getBoundingClientRect()
    const visibleDuration = audioBuffer.duration / zoomLevel
    const startTime = scrollPosition * (audioBuffer.duration - visibleDuration)
    const endTime = startTime + visibleDuration
    const duration = endTime - startTime

    // Use a for loop instead of forEach for early return
    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i]
      // Only check slices that are visible in the current view
      if (slice.end >= startTime && slice.start <= endTime) {
        // Calculate the x positions of the slice boundaries
        const startX = Math.max(0, ((slice.start - startTime) / duration) * rect.width)
        const endX = Math.min(rect.width, ((slice.end - startTime) / duration) * rect.width)

        // Check if the click is within the slice boundaries
        if (x >= startX && x <= endX) {
          return slice.id
        }
      }
    }

    return null
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !audioBuffer) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // First, check if we're clicking on a marker (highest priority)
    const marker = findMarkerAtPosition(x, y)

    if (marker) {
      // Check if it's a double-click
      const now = Date.now()
      if (now - lastClickTime < 300) {
        onMarkerDrag(marker.sliceId, marker.type, 0, true)
        setLastClickTime(0) // Reset to prevent triple-click issues
        return
      }
      setLastClickTime(now)
      setActiveMarker(marker)
      return
    }

    // Next, check if we're clicking within a slice (second priority)
    // Only check if we're not near the bottom where markers are
    if (y < rect.height - 30) {
      const clickedSlice = findSliceAtPosition(x)
      if (clickedSlice) {
        // If we clicked on a slice, trigger the onSliceClick callback immediately
        onSliceClick(clickedSlice)
        return
      }
    }

    // If we didn't click on a slice or marker, handle as before
    // Check if it's a double-click on the waveform
    const now = Date.now()
    const isDoubleClick = now - lastClickTime < 300
    setLastClickTime(now)

    // Get time position
    const timePosition = getTimeFromMousePosition(x)

    if (isDoubleClick) {
      onWaveformClick(timePosition, true)
    } else {
      // Start creating a new slice or start dragging the waveform
      if (!isCreatingSlice) {
        onWaveformClick(timePosition, false)
      } else {
        setIsDragging(true)
        setDragStartX(e.clientX)
        setInitialScroll(scrollPosition)
      }
    }
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !audioBuffer) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Update mouse position for drawing new slice
    const timePosition = getTimeFromMousePosition(x)
    setMousePosition(timePosition)

    if (activeMarker) {
      // Dragging a marker
      const visibleDuration = audioBuffer.duration / zoomLevel
      const startTime = scrollPosition * (audioBuffer.duration - visibleDuration)
      const position = startTime + (x / rect.width) * visibleDuration

      // Update the marker position
      onMarkerDrag(activeMarker.sliceId, activeMarker.type, position)
    } else if (isDragging) {
      // Dragging the waveform
      const deltaX = e.clientX - dragStartX
      const deltaRatio = deltaX / rect.width

      // Invert the direction for natural scrolling
      const newScroll = Math.max(0, Math.min(1, initialScroll - deltaRatio / zoomLevel))
      onScrollChange(newScroll)
    }
    // Removed any other mouse move handling that might cause unwanted scrolling
  }

  // Handle mouse up to end dragging
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isCreatingSlice && newSliceStart !== null) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const timePosition = getTimeFromMousePosition(x)
        onWaveformMouseUp(timePosition)
      }
    }

    setIsDragging(false)
    setActiveMarker(null)
  }

  // Handle wheel event for zooming and scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl/cmd + wheel
      const zoomDelta = e.deltaY * 0.01

      // Limit the rate of zoom changes for better performance
      const now = Date.now()
      if (now - lastZoomTime < 50) return
      setLastZoomTime(now)

      const newZoom = Math.max(1, Math.min(50, zoomLevel - zoomDelta))

      // Adjust scroll position to keep the mouse position centered
      if (Math.abs(newZoom - zoomLevel) > 0.1) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const mouseX = e.clientX - rect.left
          const mouseRatio = mouseX / rect.width

          const visibleDuration = audioBuffer.duration / zoomLevel
          const newVisibleDuration = audioBuffer.duration / newZoom

          const currentCenter = scrollPosition * (audioBuffer.duration - visibleDuration) + visibleDuration * mouseRatio
          const newScrollPosition =
            (currentCenter - newVisibleDuration * mouseRatio) / (audioBuffer.duration - newVisibleDuration)

          onScrollChange(Math.max(0, Math.min(1, newScrollPosition)))
        }
      }

      // Update the zoom level
      setZoomLevel(newZoom)
      if (onZoomChange) {
        onZoomChange(newZoom)
      }
    } else {
      // Horizontal scroll with wheel - make it smoother
      setIsScrolling(true)

      // Use a smaller multiplier for smoother scrolling
      // Detect if it's a trackpad by checking deltaMode
      const scrollMultiplier = e.deltaMode === 0 ? 0.0005 : 0.001

      // Use deltaX for horizontal scrolling if available (trackpad gesture)
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
      const newScroll = Math.max(0, Math.min(1, scrollPosition + delta * scrollMultiplier))

      onScrollChange(newScroll)

      // Reset scrolling state after a delay
      setTimeout(() => setIsScrolling(false), 150)
    }
  }

  // Update the handleCanvasMouseDown function to improve panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDraggingCanvas(true)
      setDragStartX(e.clientX)
      e.preventDefault()

      // Change cursor to grabbing
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing"
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas && containerRef.current && audioBuffer) {
      const deltaX = e.clientX - dragStartX
      const rect = containerRef.current.getBoundingClientRect()

      // Calculate scroll delta based on drag distance and zoom level
      const scrollDelta = -deltaX / (rect.width * 0.5) / zoomLevel
      const newScrollPosition = Math.max(0, Math.min(1, scrollPosition + scrollDelta))

      onScrollChange(newScrollPosition)
      setDragStartX(e.clientX)
    }
    // No scrolling when not dragging
  }

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false)

    // Reset cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = "default"
    }
  }

  // Add a new function to render the scrollbar
  const renderScrollbar = () => {
    if (!audioBuffer) return null

    const visibleDuration = audioBuffer.duration / zoomLevel
    const totalDuration = audioBuffer.duration

    // Calculate the width and position of the scrollbar thumb
    const thumbWidthPercent = Math.min(100, (visibleDuration / totalDuration) * 100)
    const thumbPositionPercent = scrollPosition * (100 - thumbWidthPercent)

    return (
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 rounded-b-md">
        {/* Scrollbar track and thumb */}
        <div
          className="absolute bottom-0 left-0 right-0 h-4 bg-gray-700 rounded-b-md cursor-pointer"
          onClick={(e) => {
            // Handle click on the scrollbar track
            if (containerRef.current) {
              const rect = e.currentTarget.getBoundingClientRect()
              const clickPositionRatio = (e.clientX - rect.left) / rect.width

              // Calculate new scroll position
              const visibleRatio = visibleDuration / totalDuration
              const newScrollPosition = Math.max(0, Math.min(1, clickPositionRatio - visibleRatio / 2))
              onScrollChange(newScrollPosition)
            }
          }}
        >
          <div
            className="absolute h-full bg-blue-500 hover:bg-blue-400 rounded-md cursor-grab active:cursor-grabbing transition-colors"
            style={{
              width: `${thumbWidthPercent}%`,
              left: `${thumbPositionPercent}%`,
            }}
            onMouseDown={(e) => {
              // Handle direct scrollbar dragging
              e.stopPropagation()
              setIsDraggingScrollbar(true)
              setScrollbarDragStart({ x: e.clientX, thumbPos: thumbPositionPercent })
            }}
          />
        </div>
      </div>
    )
  }

  // Add to the component's return statement, right after the canvas

  // Add a useEffect to update local zoomLevel when props change
  useEffect(() => {
    setZoomLevel(propsZoomLevel)
  }, [propsZoomLevel])

  // Add a handler for scrollbar dragging to the document
  useEffect(() => {
    let handleDocumentMouseMove: (e: MouseEvent) => void
    let handleDocumentMouseUp: () => void

    if (isDraggingScrollbar) {
      handleDocumentMouseMove = (e: MouseEvent) => {
        if (scrollbarDragStart && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const deltaX = e.clientX - scrollbarDragStart.x
          const deltaPercent = (deltaX / rect.width) * 100

          // Calculate new scroll position
          const visibleDuration = audioBuffer.duration / zoomLevel
          const totalDuration = audioBuffer.duration
          const thumbWidthPercent = Math.min(100, (visibleDuration / totalDuration) * 100)

          // Calculate new position ensuring it stays within bounds
          const newThumbPos = Math.max(0, Math.min(100 - thumbWidthPercent, scrollbarDragStart.thumbPos + deltaPercent))
          const newScrollPosition = newThumbPos / (100 - thumbWidthPercent)

          onScrollChange(newScrollPosition)
        }
      }

      handleDocumentMouseUp = () => {
        setIsDraggingScrollbar(false)
        setScrollbarDragStart(null)
      }

      document.addEventListener("mousemove", handleDocumentMouseMove)
      document.addEventListener("mouseup", handleDocumentMouseUp)
      setIsDocumentListenersAttached(true)
    } else {
      if (isDocumentListenersAttached) {
        document.removeEventListener("mousemove", handleDocumentMouseMove!)
        document.removeEventListener("mouseup", handleDocumentMouseUp!)
        setIsDocumentListenersAttached(false)
      }
    }

    return () => {
      if (isDocumentListenersAttached) {
        document.removeEventListener("mousemove", handleDocumentMouseMove!)
        document.removeEventListener("mouseup", handleDocumentMouseUp!)
      }
    }
  }, [isDraggingScrollbar, scrollbarDragStart, audioBuffer, zoomLevel, onScrollChange, isDocumentListenersAttached])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-muted rounded-md overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDraggingCanvas ? "grabbing" : "default" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-[calc(100%-4px)] cursor-grab"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />
      {renderScrollbar()}
    </div>
  )
}
