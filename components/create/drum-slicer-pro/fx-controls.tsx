"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Knob } from "@/app/components/knob"
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
  const [openPanel, setOpenPanel] = React.useState<string | null>(null)
  const amber = "#f5d97a"
  const slate = "#0b0a12"

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      console.info("DrumKitzz FX UI loaded (pro) - build tag UI-v2.2")
    }
  }, [])

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

  const FxSettings = ({ label, panelKey, children }: { label: string; panelKey: string; children: React.ReactNode }) => (
    <Popover open={openPanel === panelKey} onOpenChange={(next) => setOpenPanel(next ? panelKey : null)} modal>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 max-h-[70vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0b14]/95 p-3 shadow-2xl backdrop-blur"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          setOpenPanel(null)
        }}
      >
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{label}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full border border-white/10 text-white/70 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              setOpenPanel(null)
            }}
            aria-label={`Close ${label}`}
          >
            ×
          </Button>
        </div>
        {children}
      </PopoverContent>
    </Popover>
  )

  const VerticalFader = ({
    value,
    min,
    max,
    step,
    onChange,
    label,
  }: {
    value: number
    min: number
    max: number
    step: number
    onChange: (val: number) => void
    label: string
  }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-8">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] appearance-none bg-transparent"
          style={{
            accentColor: amber,
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-[3px] rounded-full bg-white/10" />
        </div>
      </div>
      <span className="text-[11px] text-white/70">{label}</span>
      <span className="text-[10px] font-mono text-amber-200">{value.toFixed(1)} dB</span>
    </div>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 ml-auto">
      <div className="flex items-center gap-1">
        <FxButton label="Vol" active={fx.volume.active} onClick={() => toggleFx("volume")} />
        <FxSettings label="Volume" panelKey={`${sliceId}-vol`}>
          <div className="rounded-2xl border border-white/10 bg-[#0f0a15] p-3 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
              <span>Volume</span>
              <span className="font-mono text-amber-200">{fx.volume.gain.toFixed(1)} dB</span>
            </div>
            <div className="mt-3 space-y-3">
              <Slider
                value={[fx.volume.gain]}
                min={-24}
                max={12}
                step={0.5}
                onValueChange={(v) => updateSliceFx(sliceId, { volume: { ...fx.volume, active: true, gain: v[0] } })}
              />
              <p className="text-[11px] text-white/50">Drag the slider or use arrow keys while focused to adjust.</p>
            </div>
          </div>
        </FxSettings>
      </div>

      <div className="flex items-center gap-1">
        <FxButton label="EQ" active={fx.eq.active} onClick={() => toggleFx("eq")} />
        <FxSettings label="Equaliser" panelKey={`${sliceId}-eq`}>
          <div className="rounded-2xl border border-white/10 bg-[#0f0a15] p-3 shadow-inner shadow-black/50">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
              <span>Equaliser</span>
              <span className="font-mono text-amber-200">±12 dB</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {eqKeys.map((key) => {
                const preset = EQ_PRESETS[key]
                if (!preset) return null
                return (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="justify-start rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:border-amber-200/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      applyEqPreset(sliceId, key)
                    }}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>

            <div className="mt-4 flex items-end justify-between rounded-xl border border-white/5 bg-[#0b0a12] p-3">
              {fx.eq.bands.map((band, idx) => (
                <VerticalFader
                  key={`${sliceId}-band-${idx}`}
                  value={band.gain}
                  min={-12}
                  max={12}
                  step={0.5}
                  label={`${band.freq >= 1000 ? (band.freq / 1000).toFixed(1) + "k" : Math.round(band.freq)} Hz`}
                  onChange={(val) => {
                    const bands = [...fx.eq.bands]
                    bands[idx] = { ...bands[idx], gain: val }
                    updateSliceFx(sliceId, { eq: { ...fx.eq, active: true, bands } })
                  }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/60">
              {fx.eq.bands.map((band, idx) => (
                <div key={`meta-${sliceId}-${idx}`} className="rounded-lg border border-white/5 bg-white/5 p-2">
                  <div className="flex items-center justify-between">
                    <span>Freq</span>
                    <span className="font-mono text-amber-200">{band.freq.toFixed(0)} Hz</span>
                  </div>
                  <Slider
                    className="mt-1"
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
                  <div className="mt-1 flex items-center justify-between">
                    <span>Q</span>
                    <span className="font-mono text-amber-200">{band.q.toFixed(2)}</span>
                  </div>
                  <Slider
                    className="mt-1"
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
              ))}
            </div>
          </div>
        </FxSettings>
      </div>

      <div className="flex items-center gap-1">
        <FxButton label="Comp" active={fx.comp.active} onClick={() => toggleFx("comp")} />
        <FxSettings label="Compressor" panelKey={`${sliceId}-comp`}>
          <div className="rounded-2xl border border-white/10 bg-[#0f0a15] p-3 shadow-inner shadow-black/50">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
              <span>Compressor</span>
              <span className="font-mono text-amber-200">GR</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {compKeys.map((key) => {
                const preset = COMP_PRESETS[key]
                if (!preset) return null
                return (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="justify-start rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:border-amber-200/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      applyCompPreset(sliceId, key)
                    }}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0b0a12] p-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Knob
                    size={110}
                    value={fx.comp.threshold}
                    min={-30}
                    max={0}
                    step={1}
                    onChange={(val) => updateSliceFx(sliceId, { comp: { ...fx.comp, active: true, threshold: val } })}
                    trackColor={amber}
                    thumbColor={amber}
                    backgroundTrackColor="#1a1824"
                    label="Threshold"
                    valueFormatter={(v) => `${v.toFixed(0)} dB`}
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Knob
                    size={110}
                    value={fx.comp.ratio}
                    min={1}
                    max={10}
                    step={0.1}
                    onChange={(val) => updateSliceFx(sliceId, { comp: { ...fx.comp, active: true, ratio: val } })}
                    trackColor={amber}
                    thumbColor={amber}
                    backgroundTrackColor="#1a1824"
                    label="Ratio"
                    valueFormatter={(v) => `${v.toFixed(1)} :1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-white/60">
                {[
                  { label: "Attack", key: "attack" as const, min: 1, max: 50, step: 1, suffix: " ms" },
                  { label: "Release", key: "release" as const, min: 20, max: 200, step: 2, suffix: " ms" },
                  { label: "Makeup", key: "makeup" as const, min: -6, max: 6, step: 0.5, suffix: " dB" },
                ].map((field) => (
                  <div key={field.key} className="rounded-lg border border-white/5 bg-white/5 p-2">
                    <div className="flex items-center justify-between">
                      <span>{field.label}</span>
                      <span className="font-mono text-amber-200">
                        {fx.comp[field.key].toFixed(1)}
                        {field.suffix}
                      </span>
                    </div>
                    <Slider
                      className="mt-1"
                      value={[fx.comp[field.key]]}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onValueChange={(v) =>
                        updateSliceFx(sliceId, { comp: { ...fx.comp, active: true, [field.key]: v[0] } })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-200 to-amber-400 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, (fx.comp.threshold + 30) / 30) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </FxSettings>
      </div>

      <div className="flex items-center gap-1">
        <FxButton label="Color" active={fx.color.active} onClick={() => toggleFx("color")} />
        <FxSettings label="Colour" panelKey={`${sliceId}-color`}>
          <div className="rounded-2xl border border-white/10 bg-[#0f0a15] p-3 shadow-inner shadow-black/50">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
              <span>Saturation</span>
              <span className="font-mono text-amber-200">{fx.color.mix.toFixed(0)}% mix</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {colorKeys.map((key) => {
                const preset = COLOR_PRESETS[key]
                if (!preset) return null
                return (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="justify-start rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:border-amber-200/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      applyColorPreset(sliceId, key)
                    }}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] text-white/60">Input</span>
                <Knob
                  size={90}
                  value={fx.color.drive}
                  min={0}
                  max={12}
                  step={0.5}
                  onChange={(val) => updateSliceFx(sliceId, { color: { ...fx.color, active: true, drive: val } })}
                  trackColor={amber}
                  thumbColor={amber}
                  backgroundTrackColor="#1a1824"
                  label=""
                  valueFormatter={(v) => `${v.toFixed(1)} dB`}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] text-white/60">Saturation</span>
                <Knob
                  size={130}
                  value={fx.color.mix}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(val) => updateSliceFx(sliceId, { color: { ...fx.color, active: true, mix: val } })}
                  trackColor={amber}
                  thumbColor={amber}
                  backgroundTrackColor="#1a1824"
                  label=""
                  valueFormatter={(v) => `${v.toFixed(0)}%`}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] text-white/60">Output</span>
                <Knob
                  size={90}
                  value={fx.color.output}
                  min={-6}
                  max={6}
                  step={0.5}
                  onChange={(val) => updateSliceFx(sliceId, { color: { ...fx.color, active: true, output: val } })}
                  trackColor={amber}
                  thumbColor={amber}
                  backgroundTrackColor="#1a1824"
                  label=""
                  valueFormatter={(v) => `${v.toFixed(1)} dB`}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-[#0b0a12] p-2 text-xs text-white/70">
              {(["tape", "tube", "transistor"] as SaturationMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 rounded-lg border px-3",
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
