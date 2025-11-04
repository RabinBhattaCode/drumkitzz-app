"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, Square } from "lucide-react"

interface PlaybackControlsProps {
  isPlaying: boolean
  isPaused?: boolean
  onPlay: () => void
  onStop: () => void
  disabled?: boolean
}

export function PlaybackControls({
  isPlaying,
  isPaused = false,
  onPlay,
  onStop,
  disabled = false,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant={isPlaying ? "secondary" : isPaused ? "outline" : "default"}
        size="lg"
        className="h-10 w-10 rounded-full"
        onClick={onPlay}
        disabled={disabled}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>

      <Button variant="outline" size="lg" className="h-10 w-10 rounded-full" onClick={onStop} disabled={disabled}>
        <Square className="h-3 w-3" />
      </Button>
    </div>
  )
}
