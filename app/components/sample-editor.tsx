"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Slice {
  id: string
  start: number
  end: number
  type: string
  name: string
  fadeIn: number
  fadeOut: number
}

interface SampleEditorProps {
  slice: Slice
  audioBuffer: AudioBuffer
  onUpdate: (updates: Partial<Slice>) => void
  onPlay: () => void
  applyFadesToAll?: boolean
  defaultFadeIn?: number
  defaultFadeOut?: number
  onApplyFadePreset?: (preset: "none" | "soft" | "dj") => void
}

export function SampleEditor({
  slice,
  audioBuffer,
  onUpdate,
  onPlay,
  applyFadesToAll = false,
  defaultFadeIn = 10,
  defaultFadeOut = 50,
  onApplyFadePreset,
}: SampleEditorProps) {
  const [name, setName] = useState(slice.name)
  const [type, setType] = useState(slice.type)
  const [fadeIn, setFadeIn] = useState(slice.fadeIn)
  const [fadeOut, setFadeOut] = useState(slice.fadeOut)
  const [startTime, setStartTime] = useState(slice.start)
  const [endTime, setEndTime] = useState(slice.end)

  // Calculate duration in milliseconds
  const duration = (endTime - startTime) * 1000

  // Handle save changes
  const handleSave = () => {
    onUpdate({
      name,
      type,
      fadeIn,
      fadeOut,
      start: startTime,
      end: endTime,
    })
  }

  // Handle start time change
  const handleStartChange = (value: number[]) => {
    const newStart = value[0]
    if (newStart < endTime - 0.01) {
      setStartTime(newStart)
    }
  }

  // Handle end time change
  const handleEndChange = (value: number[]) => {
    const newEnd = value[0]
    if (newEnd > startTime + 0.01) {
      setEndTime(newEnd)
    }
  }

  // Apply fade preset
  const handleApplyPreset = (preset: "none" | "soft" | "dj") => {
    if (onApplyFadePreset) {
      onApplyFadePreset(preset)
    } else {
      // Local fallback if no global preset handler
      let newFadeIn = 0
      let newFadeOut = 0

      switch (preset) {
        case "none":
          newFadeIn = 0
          newFadeOut = 0
          break
        case "soft":
          newFadeIn = 10
          newFadeOut = 10
          break
        case "dj":
          newFadeIn = 5
          newFadeOut = 50
          break
      }

      setFadeIn(newFadeIn)
      setFadeOut(newFadeOut)
      onUpdate({ fadeIn: newFadeIn, fadeOut: newFadeOut })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sample-name">Sample Name</Label>
          <Input id="sample-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sample-type">Sample Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="sample-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kick">Kick</SelectItem>
              <SelectItem value="snare">Snare</SelectItem>
              <SelectItem value="hat">Hi-Hat</SelectItem>
              <SelectItem value="tom">Tom</SelectItem>
              <SelectItem value="cymb">Cymbal</SelectItem>
              <SelectItem value="perc">Percussion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Start Time: {startTime.toFixed(3)}s</Label>
          <Label>End Time: {endTime.toFixed(3)}s</Label>
        </div>
        <div className="h-8 rounded-md border border-white/10 bg-black/40 relative overflow-hidden">
          <div
            className="absolute h-full rounded-md bg-gradient-to-r from-[#f5d97a]/40 to-[#f0b942]/40"
            style={{
              left: `${(startTime / audioBuffer.duration) * 100}%`,
              width: `${((endTime - startTime) / audioBuffer.duration) * 100}%`,
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Slider
            value={[startTime]}
            min={0}
            max={Math.min(endTime - 0.01, audioBuffer.duration)}
            step={0.001}
            onValueChange={handleStartChange}
          />
          <Slider
            value={[endTime]}
            min={Math.max(startTime + 0.01, 0)}
            max={audioBuffer.duration}
            step={0.001}
            onValueChange={handleEndChange}
          />
        </div>
        <div className="text-xs text-muted-foreground text-center">Duration: {duration.toFixed(0)}ms</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Fade Settings</Label>
          {onApplyFadePreset && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="apply-fades-to-all" className="text-sm">
                Apply to all
              </Label>
              <Switch id="apply-fades-to-all" checked={applyFadesToAll} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button variant="outline" size="sm" className="border-white/20 text-white/80" onClick={() => handleApplyPreset("none")}>
            None
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/80 hover:border-[#f5d97a]/60 hover:text-white"
            onClick={() => handleApplyPreset("soft")}
          >
            Soft (10ms)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/80 hover:border-[#f0b942]/70 hover:text-white"
            onClick={() => handleApplyPreset("dj")}
          >
            DJ (50ms)
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fade In: {fadeIn}ms</Label>
            <Slider value={[fadeIn]} min={0} max={100} step={1} onValueChange={(value) => setFadeIn(value[0])} />
          </div>

          <div className="space-y-2">
            <Label>Fade Out: {fadeOut}ms</Label>
            <Slider value={[fadeOut]} min={0} max={500} step={5} onValueChange={(value) => setFadeOut(value[0])} />
          </div>
        </div>

        <div className="h-4 rounded-sm relative border border-white/10 bg-black/30 overflow-hidden">
          <div
            className="absolute h-full bg-[#f5d97a]/10 rounded-sm"
            style={{
              left: `${Math.min(fadeIn / 5, 20)}%`,
              right: `${Math.min(fadeOut / 25, 20)}%`,
            }}
          />
          <div
            className="absolute h-full bg-gradient-to-r from-transparent to-[#f5d97a]/30 rounded-l-sm"
            style={{
              left: 0,
              width: `${Math.min(fadeIn / 5, 20)}%`,
            }}
          />
          <div
            className="absolute h-full bg-gradient-to-l from-transparent to-[#f0b942]/30 rounded-r-sm"
            style={{
              right: 0,
              width: `${Math.min(fadeOut / 25, 20)}%`,
            }}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" className="border-white/20 text-white/80 hover:text-white" onClick={onPlay}>
          <Play className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button className="bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black hover:brightness-110" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
