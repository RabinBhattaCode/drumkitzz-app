"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, ZoomIn, ZoomOut } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Knob } from "./knob"

interface DrumSampleProps {
  slice: {
    id: string
    start: number
    end: number
    type: string
    name: string
    selected: boolean
    fadeIn: number
    fadeOut: number
  }
  audioBuffer: AudioBuffer
  onPlay: () => void
  onUpdate: (updates: Partial<DrumSampleProps["slice"]>) => void
  onSelect: () => void
  isSelected: boolean
}

export function DrumSample({ slice, audioBuffer, onPlay, onUpdate, onSelect, isSelected }: DrumSampleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHoveringStart, setIsHoveringStart] = useState(false)
  const [isHoveringEnd, setIsHoveringEnd] = useState(false)
  const [isDraggingFade, setIsDraggingFade] = useState<"start" | "end" | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const sourceNode = useRef<AudioBufferSourceNode | null>(null)
  const playTimeout = useRef<NodeJS.Timeout | null>(null)

  // Add these state variables for horizontal scrolling
  const [scrollPosition, setScrollPosition] = useState(0.5) // 0.5 means centered
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)

  useEffect(() => {
    // Initialize AudioContext (lazily on first interaction for mobile support)
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Draw waveform
    drawWaveform()

    return () => {
      // Clean up audio resources
      if (sourceNode.current) {
        try {
          sourceNode.current.stop()
        } catch (e) {
          // Ignore errors when stopping - the node might not be started
        }
        sourceNode.current = null
      }

      if (playTimeout.current) {
        clearTimeout(playTimeout.current)
      }

      if (audioContext.current && audioContext.current.state !== "closed") {
        audioContext.current.close()
      }
    }
  }, [])

  useEffect(() => {
    drawWaveform()
  }, [slice, zoomLevel, scrollPosition])

  // Update the drawWaveform function to include horizontal scrolling
  const drawWaveform = () => {
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

    // Get sample data with zoom and scroll
    const startSample = Math.floor(slice.start * audioBuffer.sampleRate)
    const endSample = Math.floor(slice.end * audioBuffer.sampleRate)
    const totalSamples = endSample - startSample

    // Apply zoom - show a portion of the sample
    const zoomedSamples = Math.ceil(totalSamples / zoomLevel)

    // Apply horizontal scrolling
    const visibleCenter = Math.floor(startSample + totalSamples * scrollPosition)
    const zoomStartSample = Math.max(startSample, visibleCenter - Math.floor(zoomedSamples / 2))
    const zoomEndSample = Math.min(endSample, zoomStartSample + zoomedSamples)

    const data = audioBuffer.getChannelData(0).slice(zoomStartSample, zoomEndSample)

    const step = Math.ceil(data.length / rect.width)
    const amp = rect.height / 2

    ctx.beginPath()
    ctx.moveTo(0, amp)

    // Draw the waveform
    ctx.strokeStyle = getColorForType(slice.type)
    ctx.lineWidth = 2

    for (let i = 0; i < rect.width; i++) {
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

    // Draw fade in/out visualizations
    drawFades(ctx, rect.width, rect.height, startSample, endSample, zoomStartSample, zoomEndSample)
  }

  const drawFades = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startSample: number,
    endSample: number,
    zoomStartSample: number,
    zoomEndSample: number,
  ) => {
    const fadeInSamples = Math.floor((slice.fadeIn / 1000) * audioBuffer.sampleRate)
    const fadeOutSamples = Math.floor((slice.fadeOut / 1000) * audioBuffer.sampleRate)

    // Calculate fade positions in the zoomed view
    const totalZoomedSamples = zoomEndSample - zoomStartSample

    // Fade in visualization
    if (zoomStartSample <= startSample + fadeInSamples) {
      const fadeInEnd = Math.min(startSample + fadeInSamples, zoomEndSample)
      const fadeInWidth = ((fadeInEnd - zoomStartSample) / totalZoomedSamples) * width

      ctx.fillStyle = "rgba(59, 130, 246, 0.2)" // Blue with transparency
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(fadeInWidth, 0)
      ctx.lineTo(fadeInWidth, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()

      // Fade in curve
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, height)
      for (let i = 0; i <= fadeInWidth; i++) {
        const progress = i / fadeInWidth
        ctx.lineTo(i, height - progress * height)
      }
      ctx.stroke()
    }

    // Fade out visualization
    if (zoomEndSample >= endSample - fadeOutSamples) {
      const fadeOutStart = Math.max(endSample - fadeOutSamples, zoomStartSample)
      const fadeOutStartX = ((fadeOutStart - zoomStartSample) / totalZoomedSamples) * width

      ctx.fillStyle = "rgba(239, 68, 68, 0.2)" // Red with transparency
      ctx.beginPath()
      ctx.moveTo(fadeOutStartX, 0)
      ctx.lineTo(width, 0)
      ctx.lineTo(width, height)
      ctx.lineTo(fadeOutStartX, height)
      ctx.closePath()
      ctx.fill()

      // Fade out curve
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fadeOutStartX, 0)
      for (let i = 0; i <= width - fadeOutStartX; i++) {
        const progress = i / (width - fadeOutStartX)
        ctx.lineTo(fadeOutStartX + i, progress * height)
      }
      ctx.stroke()
    }
  }

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

  const handlePlayClick = async () => {
    if (isPlaying) {
      stopSample()
    } else {
      // CRITICAL FOR MOBILE: Resume AudioContext if not running (required for iOS/mobile)
      if (audioContext.current) {
        try {
          if (audioContext.current.state !== 'running') {
            console.log('[DrumSample] Resuming AudioContext, current state:', audioContext.current.state)
            await audioContext.current.resume()
            console.log('[DrumSample] AudioContext resumed, new state:', audioContext.current.state)
          }
        } catch (error) {
          console.error('[DrumSample] Failed to resume AudioContext:', error)
        }
      }

      onPlay()
      setIsPlaying(true)

      // Set a timeout to reset the playing state after the sample duration
      const duration = (slice.end - slice.start) * 1000
      playTimeout.current = setTimeout(() => {
        setIsPlaying(false)
      }, duration)
    }
  }

  const stopSample = () => {
    setIsPlaying(false)
    if (playTimeout.current) {
      clearTimeout(playTimeout.current)
      playTimeout.current = null
    }
  }

  const handleTypeChange = (value: string) => {
    onUpdate({ type: value })
  }

  const handleFadeChange = (type: "fadeIn" | "fadeOut", value: number) => {
    onUpdate({ [type]: value })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Check if hovering near the start or end of the waveform
    const startZone = rect.width * 0.1
    const endZone = rect.width * 0.9

    setIsHoveringStart(x < startZone)
    setIsHoveringEnd(x > endZone)
  }

  const handleMouseLeave = () => {
    setIsHoveringStart(false)
    setIsHoveringEnd(false)
  }

  // Add these handlers for horizontal scrolling
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDraggingCanvas(true)
      setDragStartX(e.clientX)
      e.preventDefault()
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      const deltaX = e.clientX - dragStartX
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const scrollDelta = -deltaX / rect.width / zoomLevel
        setScrollPosition(Math.max(0, Math.min(1, scrollPosition + scrollDelta)))
        setDragStartX(e.clientX)
      }
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false)
  }

  return (
    <Card className={`overflow-hidden ${isSelected ? "border-blue-500 ring-1 ring-blue-500" : ""}`} onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={slice.selected}
                onCheckedChange={(checked) => {
                  onUpdate({ selected: !!checked })
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayClick()
                }}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            </div>
            <span className="text-sm truncate">{slice.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">{((slice.end - slice.start) * 1000).toFixed(0)}ms</span>
        </div>

        <div
          ref={containerRef}
          className="h-60 bg-muted rounded-md overflow-hidden mb-2 relative"
          onMouseMove={(e) => {
            handleMouseMove(e)
            handleCanvasMouseMove(e)
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => {
            handleMouseLeave()
            handleCanvasMouseUp()
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />

          {/* Fade handles that appear on hover */}
          {isHoveringStart && (
            <div
              className="absolute left-0 top-0 bottom-0 w-6 bg-blue-500/20 cursor-col-resize flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                const newFadeIn = Math.min(100, slice.fadeIn + 5)
                handleFadeChange("fadeIn", newFadeIn)
              }}
            >
              <div className="h-12 w-1 bg-blue-500 rounded-full"></div>
            </div>
          )}

          {isHoveringEnd && (
            <div
              className="absolute right-0 top-0 bottom-0 w-6 bg-red-500/20 cursor-col-resize flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                const newFadeOut = Math.min(500, slice.fadeOut + 10)
                handleFadeChange("fadeOut", newFadeOut)
              }}
            >
              <div className="h-12 w-1 bg-red-500 rounded-full"></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-blue-500">&lt;</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mx-1">
                    <Knob
                      value={slice.fadeIn}
                      min={0}
                      max={100}
                      step={1}
                      size={20}
                      activeColor="#3b82f6"
                      onChange={(value) => handleFadeChange("fadeIn", value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fade In: {slice.fadeIn}ms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs">ms</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mx-1">
                    <Knob
                      value={slice.fadeOut}
                      min={0}
                      max={500}
                      step={5}
                      size={20}
                      activeColor="#ef4444"
                      onChange={(value) => handleFadeChange("fadeOut", value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fade Out: {slice.fadeOut}ms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs">ms</span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  const newFadeOut = Math.max(0, slice.fadeOut - 5)
                  handleFadeChange("fadeOut", newFadeOut)
                }}
              >
                <span className="text-xs">-</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  const newFadeOut = Math.min(500, slice.fadeOut + 5)
                  handleFadeChange("fadeOut", newFadeOut)
                }}
              >
                <span className="text-xs">+</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                setZoomLevel(Math.max(1, zoomLevel - 0.5))
              }}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                setZoomLevel(Math.min(20, zoomLevel + 0.5))
              }}
              disabled={zoomLevel >= 20}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Select value={slice.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kick">Kick</SelectItem>
            <SelectItem value="snare">Snare</SelectItem>
            <SelectItem value="hat">Hi-hat</SelectItem>
            <SelectItem value="tom">Tom</SelectItem>
            <SelectItem value="cymb">Cymbal</SelectItem>
            <SelectItem value="perc">Percussion</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
