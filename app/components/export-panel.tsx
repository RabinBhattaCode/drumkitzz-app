"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Play, Trash, ChevronDown, ChevronUp, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Knob } from "./knob"

const TYPE_ACCENTS: Record<string, string> = {
  kick: "border-[#f5d97a] text-[#f5d97a]",
  snare: "border-[#6b738b] text-[#6b738b]",
  hat: "border-[#7f8c9d] text-[#7f8c9d]",
  tom: "border-[#f0b942] text-[#f0b942]",
  cymb: "border-[#b084ff] text-[#b084ff]",
  perc: "border-[#d6a8ff] text-[#d6a8ff]",
}

interface ExportPanelProps {
  slices: Array<{
    id: string
    start: number
    end: number
    type: string
    name: string
    selected: boolean
    fadeIn: number
    fadeOut: number
    volume?: number
  }>
  onSliceUpdate: (
    sliceId: string,
    updates: Partial<{
      id: string
      start: number
      end: number
      type: string
      name: string
      selected: boolean
      fadeIn: number
      fadeOut: number
      volume?: number
    }>,
  ) => void
  onSlicePlay: (sliceId: string) => void
  onSliceSelect: (sliceId: string) => void
  selectedSliceId: string | null
}

export function ExportPanel({ slices, onSliceUpdate, onSlicePlay, onSliceSelect, selectedSliceId }: ExportPanelProps) {
  const [expandedSlices, setExpandedSlices] = useState<Record<string, boolean>>({})
  const [volumeControlVisible, setVolumeControlVisible] = useState<Record<string, boolean>>({})

  const toggleSelectAll = (selected: boolean) => {
    slices.forEach((slice) => {
      onSliceUpdate(slice.id, { selected })
    })
  }

  const deleteSlice = (sliceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this slice?")) {
      onSliceUpdate(sliceId, { selected: false })
    }
  }

  const toggleExpanded = (sliceId: string) => {
    setExpandedSlices((prev) => ({ ...prev, [sliceId]: !prev[sliceId] }))
  }

  const toggleVolumeControl = (sliceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setVolumeControlVisible((prev) => ({ ...prev, [sliceId]: !prev[sliceId] }))
  }

  return (
    <div className="space-y-4 text-white">
      <div className="flex justify-between items-center mb-2 text-xs uppercase tracking-[0.3em] text-white/60">
        <div className="text-sm normal-case tracking-normal text-white/80">
          {slices.filter((s) => s.selected).length} of {slices.length} selected
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" className="border-white/20 text-white/80" onClick={() => toggleSelectAll(true)}>
            Select All
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 text-white/80" onClick={() => toggleSelectAll(false)}>
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {slices.map((slice) => {
          const selected = selectedSliceId === slice.id
          return (
            <div
              key={slice.id}
              className={`rounded-2xl border p-4 transition backdrop-blur ${
                selected
                  ? "border-[#f5d97a] bg-gradient-to-b from-[#1a140a] via-[#100b04] to-[#050307] shadow-[0_0_25px_rgba(245,217,122,0.15)]"
                  : "border-white/10 bg-gradient-to-b from-[#0d0a13] via-[#08060d] to-[#050307] hover:border-white/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={slice.selected}
                      onCheckedChange={(checked) => onSliceUpdate(slice.id, { selected: !!checked })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80" onClick={() => onSlicePlay(slice.id)}>
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSlice(slice.id, e)
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                  <Badge variant="outline" className={`capitalize bg-black/20 ${TYPE_ACCENTS[slice.type] ?? "border-white/20 text-white/70"}`}>
                    {slice.type}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 text-white/70">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSliceSelect(slice.id)}>
                    <span className="text-xs font-mono">{((slice.end - slice.start) * 1000).toFixed(0)}ms</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpanded(slice.id)}>
                    {expandedSlices[slice.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70" onClick={(e) => toggleVolumeControl(slice.id, e)}>
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex items-center space-x-2">
                <Input
                  value={slice.name}
                  onChange={(e) => onSliceUpdate(slice.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 text-xs flex-1 border-white/15 bg-black/30 text-white"
                />
                <span className="text-xs text-white/60 whitespace-nowrap font-mono">
                  {slice.start.toFixed(2)}s-{slice.end.toFixed(2)}s
                </span>
              </div>

              {volumeControlVisible[slice.id] && (
                <div className="mt-3 flex items-center space-x-3 text-white/70">
                  <span className="text-xs uppercase tracking-[0.3em]">VOL</span>
                  <Slider
                    className="flex-1 h-2"
                    value={[slice.volume || 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => onSliceUpdate(slice.id, { volume: value[0] })}
                  />
                  <span className="text-xs w-10 text-right font-mono">{slice.volume || 100}%</span>
                </div>
              )}

              {expandedSlices[slice.id] && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-4 text-white/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">&lt;</span>
                      <Knob value={slice.fadeIn} min={0} max={100} step={1} size={22} activeColor="#f5d97a" onChange={(value) => onSliceUpdate(slice.id, { fadeIn: value })} />
                      <span className="text-xs text-white/50">ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Knob value={slice.fadeOut} min={0} max={500} step={5} size={22} activeColor="#f0b942" onChange={(value) => onSliceUpdate(slice.id, { fadeOut: value })} />
                      <span className="text-xs text-white/50">ms</span>
                      <div className="flex items-center text-white/70">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newFadeOut = Math.max(0, slice.fadeOut - 5)
                            onSliceUpdate(slice.id, { fadeOut: newFadeOut })
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
                            onSliceUpdate(slice.id, { fadeOut: newFadeOut })
                          }}
                        >
                          <span className="text-xs">+</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="h-4 rounded-sm relative mt-2 border border-white/10 bg-black/30 overflow-hidden">
                    <div
                      className="absolute h-full bg-[#f5d97a]/10 rounded-sm"
                      style={{
                        left: `${Math.min(slice.fadeIn / 5, 20)}%`,
                        right: `${Math.min(slice.fadeOut / 25, 20)}%`,
                      }}
                    />
                    <div
                      className="absolute h-full bg-gradient-to-r from-transparent to-[#f5d97a]/30 rounded-l-sm"
                      style={{
                        left: 0,
                        width: `${Math.min(slice.fadeIn / 5, 20)}%`,
                      }}
                    />
                    <div
                      className="absolute h-full bg-gradient-to-l from-transparent to-[#f0b942]/30 rounded-r-sm"
                      style={{
                        right: 0,
                        width: `${Math.min(slice.fadeOut / 25, 20)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {slices.length === 0 && (
          <div className="text-center py-4 text-white/50">No slices detected. Click "Detect & Slice" to analyze the audio.</div>
        )}
      </div>
    </div>
  )
}
