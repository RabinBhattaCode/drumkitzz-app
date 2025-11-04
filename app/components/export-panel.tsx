"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Play, Trash, ChevronDown, ChevronUp, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Knob } from "./knob"

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
  // Track which slices have expanded fade settings
  const [expandedSlices, setExpandedSlices] = useState<Record<string, boolean>>({})

  // Track which slices have volume controls visible
  const [volumeControlVisible, setVolumeControlVisible] = useState<Record<string, boolean>>({})

  // Toggle selection for all slices
  const toggleSelectAll = (selected: boolean) => {
    slices.forEach((slice) => {
      onSliceUpdate(slice.id, { selected })
    })
  }

  // Delete a slice
  const deleteSlice = (sliceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this slice?")) {
      // In a real app, we would dispatch an action to remove the slice
      // For now, we'll just deselect it as a workaround
      onSliceUpdate(sliceId, { selected: false })
    }
  }

  // Toggle expanded state for a slice
  const toggleExpanded = (sliceId: string) => {
    setExpandedSlices((prev) => ({
      ...prev,
      [sliceId]: !prev[sliceId],
    }))
  }

  // Toggle volume control visibility
  const toggleVolumeControl = (sliceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setVolumeControlVisible((prev) => ({
      ...prev,
      [sliceId]: !prev[sliceId],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm">
          {slices.filter((s) => s.selected).length} of {slices.length} selected
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => toggleSelectAll(true)}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleSelectAll(false)}>
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {slices.map((slice) => (
          <div
            key={slice.id}
            className={`p-2 rounded-md border ${
              selectedSliceId === slice.id ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-blue-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Consolidated checkbox, play and delete buttons */}
                <div className="flex items-center space-x-1">
                  <Checkbox
                    checked={slice.selected}
                    onCheckedChange={(checked) => {
                      onSliceUpdate(slice.id, { selected: !!checked })
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSlicePlay(slice.id)}>
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSlice(slice.id, e)
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
                <Badge
                  variant="outline"
                  className={`capitalize ${
                    slice.type === "kick"
                      ? "border-red-500 text-red-500"
                      : slice.type === "snare"
                        ? "border-blue-500 text-blue-500"
                        : slice.type === "hat"
                          ? "border-green-500 text-green-500"
                          : slice.type === "tom"
                            ? "border-amber-500 text-amber-500"
                            : slice.type === "cymb"
                              ? "border-purple-500 text-purple-500"
                              : "border-fuchsia-500 text-fuchsia-500"
                  }`}
                >
                  {slice.type}
                </Badge>
                {/* Volume control button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => toggleVolumeControl(slice.id, e)}
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSliceSelect(slice.id)}>
                  <span className="text-xs">{((slice.end - slice.start) * 1000).toFixed(0)}ms</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpanded(slice.id)}>
                  {expandedSlices[slice.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="mt-1 flex items-center space-x-2">
              <Input
                value={slice.name}
                onChange={(e) => onSliceUpdate(slice.id, { name: e.target.value })}
                className="h-7 text-xs flex-1"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {slice.start.toFixed(2)}s-{slice.end.toFixed(2)}s
              </span>
            </div>

            {/* Volume control slider - shown when volume button is clicked */}
            {volumeControlVisible[slice.id] && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs">Vol:</span>
                <Slider
                  className="flex-1 h-2"
                  value={[slice.volume || 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => onSliceUpdate(slice.id, { volume: value[0] })}
                />
                <span className="text-xs w-8 text-right">{slice.volume || 100}%</span>
              </div>
            )}

            {/* Fade settings - shown when expanded */}
            {expandedSlices[slice.id] && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-blue-500">&lt;</span>
                    <div className="mx-1">
                      <Knob
                        value={slice.fadeIn}
                        min={0}
                        max={100}
                        step={1}
                        size={20}
                        activeColor="#3b82f6"
                        onChange={(value) => onSliceUpdate(slice.id, { fadeIn: value })}
                      />
                    </div>
                    <span className="text-xs">ms</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <div className="mx-1">
                      <Knob
                        value={slice.fadeOut}
                        min={0}
                        max={500}
                        step={5}
                        size={20}
                        activeColor="#ef4444"
                        onChange={(value) => onSliceUpdate(slice.id, { fadeOut: value })}
                      />
                    </div>
                    <span className="text-xs">ms</span>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
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
                        className="h-4 w-4 p-0"
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

                <div className="h-4 bg-muted rounded-sm relative mt-1">
                  <div
                    className="absolute h-full bg-blue-500/20 rounded-sm"
                    style={{
                      left: `${Math.min(slice.fadeIn / 5, 20)}%`,
                      right: `${Math.min(slice.fadeOut / 25, 20)}%`,
                    }}
                  />
                  <div
                    className="absolute h-full bg-gradient-to-r from-transparent to-blue-500/20 rounded-l-sm"
                    style={{
                      left: 0,
                      width: `${Math.min(slice.fadeIn / 5, 20)}%`,
                    }}
                  />
                  <div
                    className="absolute h-full bg-gradient-to-l from-transparent to-blue-500/20 rounded-r-sm"
                    style={{
                      right: 0,
                      width: `${Math.min(slice.fadeOut / 25, 20)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {slices.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No slices detected. Click "Detect & Slice" to analyze the audio.
          </div>
        )}
      </div>
    </div>
  )
}
