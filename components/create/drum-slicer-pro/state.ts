// Shared state, presets, and helpers for Drum Slicer FX/kit selection.
export type KitOutputId = "drum-kit" | "instrument-one-shots" | "vocal-chops" | "bass-one-shots"
export type EqBandType = "bell" | "low_shelf" | "high_shelf"
export type SaturationMode = "tape" | "tube" | "transistor"
export type SliceTypeKey = "kick" | "snare" | "clap" | "hat" | "perc" | "generic"

export type SliceFxSettings = {
  volume: { active: boolean; gain: number }
  eq: {
    active: boolean
    preset?: string
    bands: Array<{ freq: number; gain: number; q: number; type: EqBandType }>
  }
  comp: {
    active: boolean
    preset?: string
    threshold: number
    ratio: number
    attack: number
    release: number
    makeup: number
  }
  color: {
    active: boolean
    preset?: string
    drive: number
    mix: number
    output: number
    mode: SaturationMode
  }
}

export const defaultFxSettings = (): SliceFxSettings => ({
  volume: { active: false, gain: 0 },
  eq: {
    active: false,
    preset: undefined,
    bands: [
      { freq: 60, gain: 0, q: 0.9, type: "low_shelf" },
      { freq: 250, gain: 0, q: 1, type: "bell" },
      { freq: 1000, gain: 0, q: 1, type: "bell" },
      { freq: 4000, gain: 0, q: 1, type: "bell" },
      { freq: 8000, gain: 0, q: 1, type: "bell" },
      { freq: 12000, gain: 0, q: 0.8, type: "high_shelf" },
    ],
  },
  comp: {
    active: false,
    preset: undefined,
    threshold: -12,
    ratio: 3,
    attack: 10,
    release: 100,
    makeup: 0,
  },
  color: {
    active: false,
    preset: undefined,
    drive: 6,
    mix: 60,
    output: 0,
    mode: "tape",
  },
})

export const EQ_PRESETS: Record<string, { label: string; bands: SliceFxSettings["eq"]["bands"] }> = {
  kick: {
    label: "Kick – Punchy",
    bands: [
      { freq: 60, gain: 4, q: 0.7, type: "low_shelf" },
      { freq: 320, gain: -4, q: 1.2, type: "bell" },
      { freq: 3000, gain: 3, q: 1, type: "bell" },
      { freq: 12000, gain: 2, q: 0.8, type: "high_shelf" },
      { freq: 250, gain: 0, q: 1, type: "bell" },
      { freq: 7000, gain: 0, q: 1, type: "bell" },
    ],
  },
  snare: {
    label: "Snare – Snap",
    bands: [
      { freq: 80, gain: -2, q: 0.7, type: "bell" },
      { freq: 200, gain: 4, q: 1, type: "bell" },
      { freq: 5000, gain: 6, q: 1, type: "bell" },
      { freq: 9000, gain: 2, q: 0.9, type: "high_shelf" },
      { freq: 300, gain: 0, q: 1, type: "bell" },
      { freq: 1200, gain: 0, q: 1, type: "bell" },
    ],
  },
  clap: {
    label: "Clap – Air",
    bands: [
      { freq: 180, gain: -3, q: 1.1, type: "bell" },
      { freq: 300, gain: -3, q: 1.1, type: "bell" },
      { freq: 8000, gain: 3, q: 1, type: "bell" },
      { freq: 12000, gain: 2, q: 0.8, type: "high_shelf" },
      { freq: 6000, gain: 0, q: 1, type: "bell" },
      { freq: 50, gain: 0, q: 1, type: "low_shelf" },
    ],
  },
  hat: {
    label: "Hi-Hat – Bright",
    bands: [
      { freq: 350, gain: -6, q: 1.2, type: "low_shelf" },
      { freq: 8000, gain: 5, q: 1, type: "bell" },
      { freq: 10000, gain: 3, q: 0.8, type: "high_shelf" },
      { freq: 7500, gain: -2, q: 1.2, type: "bell" },
      { freq: 1500, gain: 0, q: 1, type: "bell" },
      { freq: 500, gain: 0, q: 1, type: "bell" },
    ],
  },
  perc: {
    label: "Perc – Clear",
    bands: [
      { freq: 400, gain: -3, q: 1.2, type: "bell" },
      { freq: 5500, gain: 2, q: 1, type: "bell" },
      { freq: 8000, gain: 2, q: 0.9, type: "high_shelf" },
      { freq: 150, gain: 2, q: 1, type: "bell" },
      { freq: 50, gain: 0, q: 1.4, type: "low_shelf" },
      { freq: 2500, gain: 0, q: 1, type: "bell" },
    ],
  },
  generic: {
    label: "Balanced",
    bands: [
      { freq: 60, gain: 0, q: 0.9, type: "low_shelf" },
      { freq: 300, gain: -1, q: 1.2, type: "bell" },
      { freq: 1000, gain: 1, q: 1, type: "bell" },
      { freq: 4000, gain: 1, q: 1, type: "bell" },
      { freq: 8000, gain: 2, q: 0.9, type: "high_shelf" },
      { freq: 200, gain: 0, q: 1.2, type: "bell" },
    ],
  },
}

export const COMP_PRESETS: Record<string, { label: string; settings: Pick<SliceFxSettings["comp"], "threshold" | "ratio" | "attack" | "release" | "makeup"> }> = {
  kick: { label: "Kick – Punch", settings: { threshold: -10, ratio: 4, attack: 25, release: 100, makeup: 3 } },
  snare: { label: "Snare – Snap", settings: { threshold: -12, ratio: 3, attack: 12, release: 120, makeup: 4 } },
  clap: { label: "Clap – Tight", settings: { threshold: -14, ratio: 3, attack: 15, release: 180, makeup: 3 } },
  hat: { label: "Hat – Gentle", settings: { threshold: -6, ratio: 2, attack: 8, release: 70, makeup: 1 } },
  perc: { label: "Perc – Tight", settings: { threshold: -10, ratio: 3.5, attack: 12, release: 100, makeup: 2 } },
  generic: { label: "Glue", settings: { threshold: -10, ratio: 3, attack: 15, release: 120, makeup: 2 } },
}

export const COLOR_PRESETS: Record<string, { label: string; settings: Pick<SliceFxSettings["color"], "drive" | "mix" | "output" | "mode"> }> = {
  kick: { label: "Kick – Warm", settings: { drive: 7, mix: 60, output: -1, mode: "tape" } },
  snare: { label: "Snare – Crunch", settings: { drive: 8, mix: 50, output: -1, mode: "tube" } },
  clap: { label: "Clap – Wide", settings: { drive: 6, mix: 50, output: -1, mode: "tape" } },
  hat: { label: "Hat – Shimmer", settings: { drive: 4, mix: 55, output: 0, mode: "transistor" } },
  perc: { label: "Perc – Grit", settings: { drive: 7, mix: 60, output: -1, mode: "transistor" } },
  generic: { label: "Warmth", settings: { drive: 6, mix: 55, output: -1, mode: "tube" } },
}

export const mapSliceTypeToKey = (type: string | undefined): SliceTypeKey => {
  const t = (type || "").toLowerCase()
  if (t.includes("kick")) return "kick"
  if (t.includes("snare")) return "snare"
  if (t.includes("clap")) return "clap"
  if (t.includes("hat")) return "hat"
  if (t.includes("perc")) return "perc"
  return "generic"
}

export const filterPresetKeys = (keys: string[], sliceType: SliceTypeKey) => keys.filter((k) => k === sliceType || k === "generic")

export const KIT_OUTPUT_OPTIONS: Array<{ id: KitOutputId; title: string; description: string; helper: string; disabled?: boolean }> = [
  { id: "drum-kit", title: "Drum Kit", description: "Full stems, tops, and percussion", helper: "Multi-format ready" },
  { id: "instrument-one-shots", title: "Instrument One Shots", description: "Keys, synth stabs, melodic hits", helper: "Coming soon", disabled: true },
  { id: "vocal-chops", title: "Vocal Chops", description: "VOX hooks and phrases", helper: "Coming soon", disabled: true },
  { id: "bass-one-shots", title: "Bass One Shots", description: "Low-end punches and subs", helper: "Coming soon", disabled: true },
]
