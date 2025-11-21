"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  COLOR_PRESETS,
  COMP_PRESETS,
  EQ_PRESETS,
  filterPresetKeys,
  mapSliceTypeToKey,
  type SliceFxSettings,
  type SaturationMode,
} from "@/components/create/drum-slicer-pro/state"

interface FxControlsProps {
  sliceId: string
  sliceType?: string
  fx: SliceFxSettings
  updateSliceFx: (sliceId: string, updates: Partial<SliceFxSettings>) => void
  applyEqPreset: (sliceId: string, presetKey: string) => void
  applyCompPreset: (sliceId: string, presetKey: string) => void
  applyColorPreset: (sliceId: string, presetKey: string) => void
}

export function SliceFxControls({
  sliceId,
  sliceType,
  fx,
  updateSliceFx,
  applyEqPreset,
  applyCompPreset,
  applyColorPreset,
}: FxControlsProps) {
  const sliceTypeKey = mapSliceTypeToKey(sliceType)
  const eqKeys = filterPresetKeys(Object.keys(EQ_PRESETS), sliceTypeKey)
  const compKeys = filterPresetKeys(Object.keys(COMP_PRESETS), sliceTypeKey)
  const colorKeys = filterPresetKeys(Object.keys(COLOR_PRESETS), sliceTypeKey)

  const toggleFx = (key: keyof SliceFxSettings) => {
    const current = fx[key] as any
    updateSliceFx(sliceId, { [key]: { ...current, active: !current.active } } as any)
  }

  const FxButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={cn(
        "rounded-full border px-3 text-[11px]",
        active
          ? "border-amber-300/70 bg-amber-200/10 text-white"
          : "border-white/15 bg-white/5 text-white/70 hover:border-amber-200/60",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {label}
    </Button>
  )

  const FxSettings = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-amber-200/60"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${label} settings`}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 space-y-3 p-3">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 ml-auto">
      <div className="flex items-center gap-1">
        <FxButton label="Vol" active={fx.volume.active} onClick={() => toggleFx("volume")} />
        <FxSettings label="Volume">
          <DropdownMenuLabel className="text-xs text-white/60">Volume</DropdownMenuLabel>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Gain</span>
              <span className="font-mono">{fx.volume.gain.toFixed(1)} dB</span>
            </div>
            <Slider
              value={[fx.volume.gain]}
              min={-24}
              max={12}
              step={0.5}
              onValueChange={(v) => updateSliceFx(sliceId, { volume: { ...fx.volume, active: true, gain: v[0] } })}
            />
          </div>
        </FxSettings>
      </div>

      <div className="flex items-center gap-1">
        <FxButton label="EQ" active={fx.eq.active} onClick={() => toggleFx("eq")} />
        <FxSettings label="Equaliser">
          <DropdownMenuLabel className="text-xs text-white/60">EQ Presets</DropdownMenuLabel>
          {eqKeys.map((key) => {
            const preset = EQ_PRESETS[key]
            if (!preset) return null
            return (
              <DropdownMenuItem
                key={key}
                onClick={(e) => {
                  e.stopPropagation()
                  applyEqPreset(sliceId, key)
                }}
                className="text-sm"
              >
                {preset.label}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-white/60">Bands</DropdownMenuLabel>
          <div className="space-y-2">
            {fx.eq.bands.map((band, idx) => (
              <div key={`${sliceId}-band-${idx}`} className="space-y-1 rounded-lg bg-white/5 p-2">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span>
                    Band {idx + 1} • {band.type.replace("_", " ")} • {Math.round(band.freq)} Hz
                  </span>
                  <span className="font-mono text-white/80">
                    {band.gain > 0 ? "+" : ""}
                    {band.gain.toFixed(1)} dB
                  </span>
                </div>
                <Slider
                  value={[band.gain]}
                  min={-12}
                  max={12}
                  step={0.5}
                  onValueChange={(v) => {
                    const bands = [...fx.eq.bands]
                    bands[idx] = { ...bands[idx], gain: v[0] }
                    updateSliceFx(sliceId, { eq: { ...fx.eq, active: true, bands } })
                  }}
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] text-white/50">
                      <span>Freq</span>
                      <span className="font-mono text-white/80">{band.freq.toFixed(0)} Hz</span>
                    </div>
                    <Slider
                      value={[band.freq]}
                      min={20}
                      max={20000}
                      step={10}
                      onValueChange={(v) => {
                        const bands = [...fx.eq.bands]
                        bands[idx] = { ...bands[idx], freq: v[0] }
                        updateSliceFx(sliceId, { eq: { ...fx.eq, active: true, bands } })
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] text-white/50">
                      <span>Q</span>
                      <span className="font-mono text-white/80">{band.q.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[band.q]}
                      min={0.1}
                      max={18}
                      step={0.1}
                      onValueChange={(v) => {
                        const bands = [...fx.eq.bands]
                        bands[idx] = { ...bands[idx], q: v[0] }
                        updateSliceFx(sliceId, { eq: { ...fx.eq, active: true, bands } })
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FxSettings>
      </div>

      <div className="flex items-center gap-1">
        <FxButton label="Comp" active={fx.comp.active} onClick={() => toggleFx("comp")} />
        <FxSettings label="Compressor">
          <DropdownMenuLabel className="text-xs text-white/60">Compressor Presets</DropdownMenuLabel>
          {compKeys.map((key) => {
            const preset = COMP_PRESETS[key]
            if (!preset) return null
            return (
              <DropdownMenuItem
                key={key}
                onClick={(e) => {
                  e.stopPropagation()
                  applyCompPreset(sliceId, key)
                }}
                className="text-sm"
              >
                {preset.label}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <div className="space-y-3 text-white/80">
            {[
              { label: "Threshold", key: "threshold" as const, min: -30, max: 0, step: 1, suffix: " dB" },
              { label: "Ratio", key: "ratio" as const, min: 1, max: 10, step: 0.1, suffix: " :1" },
              { label: "Attack", key: "attack" as const, min: 1, max: 50, step: 1, suffix: " ms" },
              { label: "Release", key: "release" as const, min: 20, max: 200, step: 2, suffix: " ms" },
              { label: "Makeup", key: "makeup" as const, min: -6, max: 6, step: 0.5, suffix: " dB" },
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{field.label}</span>
                  <span className="font-mono text-white/80">
                    {fx.comp[field.key].toFixed(1)}
                    {field.suffix}
                  </span>
                </div>
                <Slider
                  value={[fx.comp[field.key]]}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onValueChange={(v) => updateSliceFx(sliceId, { comp: { ...fx.comp, active: true, [field.key]: v[0] } })}
                />
              </div>
            ))}
          </div>
        </FxSettings>
      </div>

      <div className="flex items-center gap-1">
        <FxButton label="Color" active={fx.color.active} onClick={() => toggleFx("color")} />
        <FxSettings label="Colour">
          <DropdownMenuLabel className="text-xs text-white/60">Saturation Presets</DropdownMenuLabel>
          {colorKeys.map((key) => {
            const preset = COLOR_PRESETS[key]
            if (!preset) return null
            return (
              <DropdownMenuItem
                key={key}
                onClick={(e) => {
                  e.stopPropagation()
                  applyColorPreset(sliceId, key)
                }}
                className="text-sm"
              >
                {preset.label}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <div className="space-y-2 text-white/80">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Drive</span>
                <span className="font-mono text-white/80">{fx.color.drive.toFixed(1)} dB</span>
              </div>
              <Slider
                value={[fx.color.drive]}
                min={0}
                max={12}
                step={0.5}
                onValueChange={(v) => updateSliceFx(sliceId, { color: { ...fx.color, active: true, drive: v[0] } })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Mix</span>
                <span className="font-mono text-white/80">{fx.color.mix.toFixed(0)}%</span>
              </div>
              <Slider
                value={[fx.color.mix]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => updateSliceFx(sliceId, { color: { ...fx.color, active: true, mix: v[0] } })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Output</span>
                <span className="font-mono text-white/80">{fx.color.output.toFixed(1)} dB</span>
              </div>
              <Slider
                value={[fx.color.output]}
                min={-6}
                max={6}
                step={0.5}
                onValueChange={(v) => updateSliceFx(sliceId, { color: { ...fx.color, active: true, output: v[0] } })}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              {(["tape", "tube", "transistor"] as SaturationMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full border px-2",
                    fx.color.mode === mode
                      ? "border-amber-300/70 bg-amber-200/10 text-white"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-amber-200/60",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateSliceFx(sliceId, { color: { ...fx.color, active: true, mode } })
                  }}
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </FxSettings>
      </div>
    </div>
  )
}
