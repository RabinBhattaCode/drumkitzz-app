"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Upload,
  Mic,
  Play,
  Pause,
  Square,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Trash,
  Settings,
  RotateCcw,
  RotateCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { loadProject as loadProjectFromApi, saveProject as saveProjectToApi } from "@/lib/projects"
import { YouTubeExtractor } from "@/app/components/youtube-extractor"
import { SliceWaveform } from "@/app/components/slice-waveform"
import { Waveform } from "@/app/components/waveform"
import { TrimWaveform } from "@/app/components/trim-waveform"
import { CircularWaveform } from "@/app/components/circular-waveform"
import { Knob } from "@/app/components/knob"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { extractDrumsWithLalalAI, type ExtractionProgress } from "@/lib/audio-extraction"
import { ExtractionProgressDialog } from "@/app/components/extraction-progress-dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { uploadFiles } from "@/lib/uploadthing"
import {
  COLOR_PRESETS,
  COMP_PRESETS,
  EQ_PRESETS,
  KIT_OUTPUT_OPTIONS,
  defaultFxSettings,
  filterPresetKeys,
  mapSliceTypeToKey,
  type EqBandType,
  type KitOutputId,
  type SaturationMode,
  type SliceFxSettings,
} from "@/components/create/drum-slicer-pro/state"
import { SliceFxControls } from "@/components/create/drum-slicer-pro/fx-controls"

// Define OfflineContext type
type OfflineContext = OfflineAudioContext


const MIN_TRIM_DURATION = 3
const MAX_TRIM_DURATION = 60

const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return "0:00"
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(Math.max(0, value % 60))
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const SLICE_ACCENT_COLORS: Record<string, string> = {
  kick: "#f5d97a",
  snare: "#6b738b",
  hat: "#7f8c9d",
  tom: "#f0b942",
  cymb: "#b084ff",
  perc: "#d6a8ff",
  bass: "#6fd0c0",
}

const dbToGain = (db: number) => Math.pow(10, db / 20)

const createEqFilters = (ctx: AudioContext, fx: SliceFxSettings["eq"]) => {
  if (!fx.active) return []
  return fx.bands.map((band) => {
    const filter = ctx.createBiquadFilter()
    filter.frequency.value = band.freq
    filter.gain.value = band.gain
    filter.Q.value = band.q
    filter.type =
      band.type === "low_shelf" ? "lowshelf" : band.type === "high_shelf" ? "highshelf" : "peaking"
    return filter
  })
}

const createCompressor = (ctx: AudioContext, fx: SliceFxSettings["comp"]) => {
  if (!fx.active) return null
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = fx.threshold
  comp.ratio.value = fx.ratio
  comp.attack.value = fx.attack / 1000
  comp.release.value = fx.release / 1000
  comp.knee.value = 6
  const makeup = ctx.createGain()
  makeup.gain.value = dbToGain(fx.makeup)
  comp.connect(makeup)
  return { input: comp, output: makeup }
}

const createColor = (ctx: AudioContext, fx: SliceFxSettings["color"]) => {
  if (!fx.active) return null
  const shaper = ctx.createWaveShaper()
  const drive = Math.max(0, fx.drive)
  const amount = Math.min(1, drive / 24)
  const samples = 2048
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1
    const strength = fx.mode === "tube" ? 1.5 : fx.mode === "tape" ? 1.2 : 2
    curve[i] = Math.tanh(strength * amount * x)
  }
  shaper.curve = curve
  shaper.oversample = "4x"

  const wetGain = ctx.createGain()
  wetGain.gain.value = fx.mix / 100
  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - wetGain.gain.value

  const postGain = ctx.createGain()
  postGain.gain.value = dbToGain(fx.output)

  return { shaper, wetGain, dryGain, postGain }
}

const AUDITION_KEY_LAYOUT = [
  ["r", "t", "y", "u", "i"],
  ["d", "f", "g", "h", "j"],
] as const

const AUDITION_KEY_ORDER = AUDITION_KEY_LAYOUT.flat()

type DrumSlicerProProps = {
  variant?: "classic" | "modern"
}

type PendingAudioSource = "upload" | "record" | "youtube"

type Slice = {
  id: string
  start: number
  end: number
  type: string
  name: string
  selected: boolean
  fadeIn: number
  fadeOut: number
  fadeInShape: number
  fadeOutShape: number
  volume?: number
}

export default function DrumSlicerPro({ variant = "classic" }: DrumSlicerProProps) {
  const isModern = variant === "modern"
  const BUILD_TAG = "UI-v2.2"
  // Auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldAutoExport = ["1", "true", "yes"].includes((searchParams.get("autoExport") || "").toLowerCase())
  const autoReturnMode = searchParams.get("autoReturn") || null

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [originalAudioBuffer, setOriginalAudioBuffer] = useState<AudioBuffer | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStemExtracting, setIsStemExtracting] = useState(0)
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress>({
    stage: "uploading",
    progress: 0,
    message: "Starting extraction...",
  })
  const [showExtractionDialog, setShowExtractionDialog] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioContextInitialized, setAudioContextInitialized] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [useOriginalAudio, setUseOriginalAudio] = useState(false)
  const [autoExtractDrums, setAutoExtractDrums] = useState(false)
  const [selectedKitOutput, setSelectedKitOutput] = useState<KitOutputId>("drum-kit")
  const [detectedOutputs, setDetectedOutputs] = useState<KitOutputId[]>([])
  const [pendingAudioBuffer, setPendingAudioBuffer] = useState<AudioBuffer | null>(null)
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null)
  const [showTrimPreview, setShowTrimPreview] = useState(false)
  const [trimSelection, setTrimSelection] = useState<[number, number]>([0, 0])
  const [previewPlaybackTime, setPreviewPlaybackTime] = useState(0)
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ url: string; key: string } | null>(null)
  const [cloudBackupStatus, setCloudBackupStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [isUploadDragActive, setIsUploadDragActive] = useState(false)
  const [pendingAudioSource, setPendingAudioSource] = useState<PendingAudioSource | null>(null)
  const [isProjectLoading, setIsProjectLoading] = useState(false)

  // Slicing state
  const [slices, setSlices] = useState<Slice[]>([])
  const [sliceFx, setSliceFx] = useState<Record<string, SliceFxSettings>>({})
  const [potentialSlices, setPotentialSlices] = useState<Array<number>>([])
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null)
  const [isCreatingSlice, setIsCreatingSlice] = useState(false)
  const [newSliceStart, setNewSliceStart] = useState<number | null>(null)
  const [sliceHistory, setSliceHistory] = useState<{ past: Slice[][]; future: Slice[][] }>({
    past: [],
    future: [],
  })
  const hasAutoDetectedRef = useRef(false)
  const hasAutoExportedRef = useRef(false)

  // Add state for individual slice zoom levels and scroll positions
  const [sliceZoomLevels, setSliceZoomLevels] = useState<Record<string, number>>({})
  const [sliceScrollPositions, setSliceScrollPositions] = useState<Record<string, number>>({})

  // Detection settings
  const [sensitivity, setSensitivity] = useState(0.15)
  const [minDistance, setMinDistance] = useState(0.1)

  // Kit naming
  const [kitName, setKitName] = useState("")
  const [kitPrefix, setKitPrefix] = useState("DK2")
  const [isEditingKitName, setIsEditingKitName] = useState(false)
  const [hasCustomKitName, setHasCustomKitName] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [kitTags, setKitTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [kitCategory, setKitCategory] = useState<"drum" | "loop">("drum")

  // Export settings
  const [exportFormat, setExportFormat] = useState<"wav" | "mp3">("mp3")
  const [includeMidi, setIncludeMidi] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isSavingKit, setIsSavingKit] = useState(false)

  // Zoom and navigation
  const [zoomLevel, setZoomLevel] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isZoomingIn, setIsZoomingIn] = useState(false)
  const [isZoomingOut, setIsZoomingOut] = useState(false)
  // Grid layout for slices
  const [gridLayout, setGridLayout] = useState<1 | 2 | 3 | 4>(3) // Default to 3 slices per row (small view)
  const [auditionEnabled, setAuditionEnabled] = useState(false)
  const [activeAuditionKey, setActiveAuditionKey] = useState<string | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const [kitId, setKitId] = useState<string | null>(null)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [autoExportQueued, setAutoExportQueued] = useState(false)
  const [autoExportStatus, setAutoExportStatus] = useState<"idle" | "preparing">("idle")

  const MAX_SLICE_HISTORY = 50
  const setSlicesWithHistory = (
    nextSlicesOrUpdater: Slice[] | ((prev: Slice[]) => Slice[]),
    trackHistory = true,
  ) => {
    setSlices((current) => {
      const next = typeof nextSlicesOrUpdater === "function" ? nextSlicesOrUpdater(current) : nextSlicesOrUpdater

      if (trackHistory) {
        setSliceHistory((history) => {
          const past = [...history.past, current]
          return { past: past.slice(-MAX_SLICE_HISTORY), future: [] }
        })
      }

      return next
    })
  }

  const undoSlices = () => {
    setSliceHistory((history) => {
      if (history.past.length === 0) return history
      const previous = history.past[history.past.length - 1]
      const newPast = history.past.slice(0, -1)
      const newFuture = [slices, ...history.future]
      setSlices(previous)
      return { past: newPast, future: newFuture }
    })
  }

  const redoSlices = () => {
    setSliceHistory((history) => {
      if (history.future.length === 0) return history
      const next = history.future[0]
      const remainingFuture = history.future.slice(1)
      const newPast = [...history.past, slices].slice(-MAX_SLICE_HISTORY)
      setSlices(next)
      return { past: newPast, future: remainingFuture }
    })
  }

  const resetSliceHistory = () => setSliceHistory({ past: [], future: [] })

  const clearSlices = (trackHistory = true) => {
    setSlicesWithHistory([], trackHistory)
    setSelectedSliceId(null)
  }

  const canUndo = sliceHistory.past.length > 0
  const canRedo = sliceHistory.future.length > 0
  const hasSlices = slices.length > 0

  const addTag = (next: string) => {
    const value = next.trim()
    if (!value) return
    setKitTags((prev) => {
      if (prev.includes(value)) return prev
      if (prev.length >= 3) return prev
      return [...prev, value]
    })
    setTagInput("")
  }

  const removeTag = (tag: string) => setKitTags((prev) => prev.filter((t) => t !== tag))

  // Ensure each slice has FX defaults
  useEffect(() => {
    setSliceFx((prev) => {
      const next = { ...prev }
      let changed = false
      slices.forEach((slice) => {
        if (!next[slice.id]) {
          next[slice.id] = defaultFxSettings()
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [slices])

  useEffect(() => {
    if (!shouldAutoExport) {
      hasAutoExportedRef.current = false
      setAutoExportQueued(false)
      setAutoExportStatus("idle")
    }
  }, [shouldAutoExport])

  // Audio context
  const audioContext = useRef<AudioContext | null>(null)

  const totalDurationLabel = audioBuffer ? formatTime(audioBuffer.duration) : "0:00"
  const currentTimeLabel = formatTime(currentPlaybackTime)
  const sampleRateLabel = audioBuffer ? `${(audioBuffer.sampleRate / 1000).toFixed(1)} kHz` : "--"
  const sourceNode = useRef<AudioBufferSourceNode | null>(null)
  const gainNode = useRef<GainNode | null>(null)
  const playbackStartTime = useRef<number>(0)
  const pausedTime = useRef<number>(0)
  const animationFrameId = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const previewAudioContextRef = useRef<AudioContext | null>(null)
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const previewStartTimeRef = useRef<number | null>(null)
  const recordingStartRef = useRef<number | null>(null)
  const recordingRafRef = useRef<number | null>(null)
  const offlineAudioContextRef = useRef<OfflineContext | null>(null)
  const auditionPressedKeysRef = useRef<Set<string>>(new Set())
  const { toast } = useToast()
  const { user } = useAuth()

  // Refs for waveform interaction
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState<number | null>(null)

  // Helper function to get time from mouse position
  const getTimeFromMousePosition = (x: number): number => {
    if (!audioBuffer || !containerRef.current) return 0
    const rect = containerRef.current.getBoundingClientRect()
    const totalWidth = rect.width
    const timePosition = (x / totalWidth) * audioBuffer.duration
    return timePosition
  }

  const shouldApplyLowCut = (sliceType: string | undefined) => {
    return !(sliceType || "").toLowerCase().includes("kick")
  }

  // Simple single-pole high-pass (low cut) to tame sub/bass for non-kick slices
  const applyLowCut300Hz = (buffer: AudioBuffer, sliceType: string | undefined) => {
    if (!shouldApplyLowCut(sliceType)) return
    const cutoff = 300
    const sampleRate = buffer.sampleRate
    const rc = 1 / (2 * Math.PI * cutoff)
    const dt = 1 / sampleRate
    const alpha = rc / (rc + dt)

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      let prevX = data[0] || 0
      let prevY = data[0] || 0
      for (let i = 0; i < data.length; i++) {
        const x = data[i]
        const y = alpha * (prevY + x - prevX)
        data[i] = y
        prevX = x
        prevY = y
      }
    }
  }

  // Initialize audio context with user interaction
  const initializeAudioContext = async ({ showToast = true }: { showToast?: boolean } = {}) => {
    if (!audioContextInitialized) {
      try {
        console.log('[Audio] Initializing AudioContext...')
        // Create audio context (with webkit prefix for older Safari)
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        console.log('[Audio] AudioContext created, state:', audioContext.current.state)

        // CRITICAL FOR MOBILE: Resume audio context immediately after creation
        // This is required for iOS and mobile browsers to unlock audio
        if (audioContext.current.state !== "running") {
          console.log('[Audio] AudioContext not running, resuming...')
          await audioContext.current.resume()
          console.log('[Audio] AudioContext resumed, new state:', audioContext.current.state)
        }

        // Create gain node and connect to destination
        gainNode.current = audioContext.current.createGain()
        gainNode.current.connect(audioContext.current.destination)
        console.log('[Audio] Gain node created and connected to destination')

        // Set initial volume
        if (gainNode.current) {
          gainNode.current.gain.value = volume
          console.log('[Audio] Initial volume set to:', volume)
        }

        setAudioContextInitialized(true)
        console.log('[Audio] AudioContext initialized successfully')

        // Show success toast
        if (showToast) {
          toast({
            title: "Audio initialized",
            description: "Audio playback is now enabled",
          })
        }
      } catch (error) {
        console.error("[Audio] Failed to initialize audio context:", error)
        toast({
          title: "Audio Error",
          description: "Failed to initialize audio. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // If already initialized, ensure it's resumed (for mobile)
      if (audioContext.current && audioContext.current.state !== "running") {
        try {
          console.log('[Audio] AudioContext already initialized but not running, resuming...')
          await audioContext.current.resume()
          console.log('[Audio] AudioContext resumed, state:', audioContext.current.state)
        } catch (error) {
          console.error('[Audio] Failed to resume existing AudioContext:', error)
        }
      }
    }
  }

  useEffect(() => {
    if (audioContextInitialized) {
      return
    }

    let unlocked = false

    const unlockAudioContext = () => {
      if (unlocked) return
      unlocked = true
      initializeAudioContext({ showToast: false }).catch((error) => {
        console.error("[Audio] Failed to unlock audio context on gesture:", error)
      })
    }

    const events: Array<keyof WindowEventMap> = ["pointerdown", "touchstart"]
    events.forEach((event) => window.addEventListener(event, unlockAudioContext, { once: true }))

    return () => {
      events.forEach((event) => window.removeEventListener(event, unlockAudioContext))
    }
  }, [audioContextInitialized])

  // Create a sample audio buffer with a simple drum pattern
  const createSampleAudioBuffer = (audioContext: AudioContext): AudioBuffer => {
    const sampleRate = audioContext.sampleRate
    const duration = 4 // 4 seconds of audio
    const frameCount = sampleRate * duration

    // Create an empty stereo buffer
    const audioBuffer = audioContext.createBuffer(2, frameCount, sampleRate)

    // Fill the buffer with a simple drum pattern
    for (let channel = 0; channel < 2; channel++) {
      const channelData = audioBuffer.getChannelData(channel)

      // Create a simple kick and snare pattern
      for (let i = 0; i < frameCount; i++) {
        // Kick drum on beats 1 and 3
        if (i % (sampleRate / 2) < 0.1 * sampleRate) {
          channelData[i] = Math.sin(i * 0.01) * Math.exp(-i * 0.001) * 0.5
        }

        // Snare on beats 2 and 4
        if ((i + sampleRate / 4) % (sampleRate / 2) < 0.1 * sampleRate) {
          channelData[i] += (Math.random() * 2 - 1) * Math.exp(-(i % (sampleRate / 2)) * 0.001) * 0.3
        }
      }
    }

    return audioBuffer
  }

  // Handle continuous zooming
  useEffect(() => {
    let zoomInterval: NodeJS.Timeout | null = null

    if (isZoomingIn) {
      zoomInterval = setInterval(() => {
        setZoomLevel((prev) => Math.min(50, prev + 1))
      }, 100)
    } else if (isZoomingOut) {
      zoomInterval = setInterval(() => {
        setZoomLevel((prev) => Math.max(1, prev - 1))
      }, 100)
    }

    return () => {
      if (zoomInterval) clearInterval(zoomInterval)
    }
  }, [isZoomingIn, isZoomingOut])

  // Update kit prefix when kit name changes
  useEffect(() => {
    // Extract initials or first word characters
    const words = kitName.split(" ")
    if (words.length >= 2) {
      // Use first letter of first word and first letter of last word
      const firstInitial = words[0][0] || ""
      const lastInitial = words[words.length - 1][0] || ""
      // Extract any numbers from the kit name
      const numbers = kitName.match(/\d+/)
      const numberPart = numbers ? numbers[0] : ""

      setKitPrefix(`${firstInitial}${lastInitial}${numberPart}`.toUpperCase())
    } else if (words.length === 1 && words[0]) {
      // Use first two letters of single word
      setKitPrefix(words[0].substring(0, 2).toUpperCase())
    }

    // Update hasCustomKitName state based on whether kitName has content
    setHasCustomKitName(kitName.trim() !== "")
  }, [kitName])

  // Update potential slices when sensitivity changes
  useEffect(() => {
    if (!audioBuffer) return

    // Debounce the detection to avoid performance issues
    const handler = setTimeout(() => {
      const audioData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      const isDrumish = selectedKitOutput === "drum-kit"
      const positions = isDrumish
        ? findPotentialTransients(audioData, sampleRate, sensitivity, minDistance)
        : findPotentialTransients(audioData, sampleRate, sensitivity, Math.max(minDistance, 0.2))

      setPotentialSlices(positions)
    }, 300)

    return () => clearTimeout(handler)
  }, [audioBuffer, sensitivity, minDistance, selectedKitOutput])

  // Update volume when changed
  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Switch between original and drum stem audio
  useEffect(() => {
    if (useOriginalAudio && originalAudioBuffer) {
      setAudioBuffer(originalAudioBuffer)
      // Reset slices when switching to original audio
      clearSlices(false)
      resetSliceHistory()
      setPotentialSlices([])
    } else if (!useOriginalAudio && originalAudioBuffer && audioBuffer !== originalAudioBuffer) {
      // If we have a drum stem, use it
      // Note: This assumes extractDrumStem has been called and set a different audioBuffer
      // If they're the same, we don't need to do anything
    }
  }, [useOriginalAudio, originalAudioBuffer])

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (sourceNode.current) {
        sourceNode.current.stop()
      }
      if (audioContext.current && audioContext.current.state !== "closed") {
        audioContext.current.close()
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      stopRecordingTimer()
    }
  }, [])

  // Initialize slice zoom levels and scroll positions for new slices
  useEffect(() => {
    // For any new slices that don't have zoom/scroll settings yet, initialize them
    const newZoomLevels = { ...sliceZoomLevels }
    const newScrollPositions = { ...sliceScrollPositions }
    let hasChanges = false

    slices.forEach((slice) => {
      if (newZoomLevels[slice.id] === undefined) {
        newZoomLevels[slice.id] = 1
        hasChanges = true
      }
      if (newScrollPositions[slice.id] === undefined) {
        newScrollPositions[slice.id] = 0.5 // Center position
        hasChanges = true
      }
    })

    if (hasChanges) {
      setSliceZoomLevels(newZoomLevels)
      setSliceScrollPositions(newScrollPositions)
    }
  }, [slices])

  useEffect(() => {
    if (
      audioBuffer &&
      typeof (audioBuffer as any).getChannelData === "function" &&
      slices.length === 0 &&
      potentialSlices.length === 0 &&
      !isProcessing &&
      !hasAutoDetectedRef.current
    ) {
      hasAutoDetectedRef.current = true
      void detectSlices(audioBuffer)
    }
  }, [audioBuffer, slices.length, potentialSlices.length, isProcessing])

  // Handle kit name input changes
  const handleKitNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKitName(e.target.value)
    setIsTyping(true)
  }

  // Handle kit name input blur
  const handleKitNameBlur = () => {
    setIsEditingKitName(false)
    setIsTyping(false)
  }

  useEffect(() => {
    if (!showTrimPreview) {
      setPreviewPlaybackTime(trimSelection[0])
      stopPreviewPlayback()
      return
    }

    if (!isPreviewPlaying) {
      setPreviewPlaybackTime(trimSelection[0])
      return
    }

    let raf: number
    const update = () => {
      if (previewAudioContextRef.current && previewStartTimeRef.current !== null) {
        const elapsed = previewAudioContextRef.current.currentTime - previewStartTimeRef.current
        setPreviewPlaybackTime(Math.min(trimSelection[1], trimSelection[0] + elapsed))
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [showTrimPreview, trimSelection, isPreviewPlaying])

  const stopPreviewPlayback = () => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop()
      } catch {
        // ignore
      }
      previewSourceRef.current.disconnect()
      previewSourceRef.current = null
    }
    if (previewAudioContextRef.current) {
      previewAudioContextRef.current.close()
      previewAudioContextRef.current = null
    }
    previewStartTimeRef.current = null
    setIsPreviewPlaying(false)
  }

  const startPreviewPlayback = async () => {
    if (!pendingAudioBuffer) return
    stopPreviewPlayback()
    const ctx = new AudioContext()
    const source = ctx.createBufferSource()
    source.buffer = pendingAudioBuffer
    source.connect(ctx.destination)
    try {
      await ctx.resume()
    } catch (error) {
      console.error("Error resuming preview context:", error)
    }
    previewAudioContextRef.current = ctx
    previewSourceRef.current = source
    const offset = trimSelection[0]
    previewStartTimeRef.current = ctx.currentTime - offset
    const duration = Math.min(trimSelection[1], pendingAudioBuffer.duration) - trimSelection[0]
    source.start(0, offset, Math.max(0, duration))
    source.onended = () => {
      stopPreviewPlayback()
    }
    setPreviewPlaybackTime(offset)
    setIsPreviewPlaying(true)
  }

  const normalizeTrimRange = (range: [number, number]) => {
    if (!pendingAudioBuffer) return range
    const duration = pendingAudioBuffer.duration
    let [start, end] = range
    if (start > end) [start, end] = [end, start]
    start = Math.max(0, Math.min(start, duration))
    end = Math.max(start, Math.min(end, duration))
    let span = end - start
    if (duration <= MIN_TRIM_DURATION) {
      return [0, duration]
    }
    if (span < MIN_TRIM_DURATION) {
      end = Math.min(duration, start + MIN_TRIM_DURATION)
      start = Math.max(0, end - MIN_TRIM_DURATION)
      span = MIN_TRIM_DURATION
    }
    if (span > MAX_TRIM_DURATION) {
      end = Math.min(duration, start + MAX_TRIM_DURATION)
    }
    return [start, end]
  }

  const openTrimPreview = (buffer: AudioBuffer, file: File | null, source: PendingAudioSource) => {
    stopPreviewPlayback()
    setPendingAudioBuffer(buffer)
    setPendingAudioFile(file)
    setPendingAudioSource(source)
    setDetectedOutputs([])
    const end = buffer.duration < MIN_TRIM_DURATION ? buffer.duration : Math.min(MAX_TRIM_DURATION, buffer.duration)
    setTrimSelection([0, end])
    setShowTrimPreview(true)
  }

  const trimAudioBuffer = async (buffer: AudioBuffer, start: number, end: number) => {
    const duration = Math.max(0.01, Math.min(buffer.duration, end) - start)
    const offline = new OfflineAudioContext(buffer.numberOfChannels, duration * buffer.sampleRate, buffer.sampleRate)
    const source = offline.createBufferSource()
    source.buffer = buffer
    source.connect(offline.destination)
    source.start(0, start, duration)
    return offline.startRendering()
  }

  const commitTrimSelection = async () => {
    if (!pendingAudioBuffer) return
    const [start, end] = trimSelection
    const trimmed = await trimAudioBuffer(pendingAudioBuffer, start, end)
    setAudioBuffer(trimmed)
    setOriginalAudioBuffer(pendingAudioBuffer)
    setShowTrimPreview(false)
    stopPreviewPlayback()

    // Build a trimmed file to send downstream (so we never send the full upload)
    let trimmedFile: File | null = null
    if (pendingAudioFile) {
      const wavBlob = await bufferToWav(trimmed)
      const baseName = pendingAudioFile.name.replace(/\.[^.]+$/, "")
      trimmedFile = new File([wavBlob], `trimmed-${baseName}.wav`, { type: "audio/wav" })
    }
    setPendingAudioFile(trimmedFile)
    setAudioFile(trimmedFile)
    setPendingAudioSource(null)
    setPendingAudioBuffer(null)

    if (trimmedFile && autoExtractDrums) {
      extractDrumStem(trimmedFile)
    }

    toast({
      title: "Selection saved",
      description: `Trimmed ${(end - start).toFixed(1)}s window ready for slicing.`,
    })
  }

  const stopRecordingTimer = () => {
    if (recordingRafRef.current !== null) {
      cancelAnimationFrame(recordingRafRef.current)
      recordingRafRef.current = null
    }
    recordingStartRef.current = null
  }

  const isSupportedFile = (file: File) => {
    const lower = file.name.toLowerCase()
    return (
      file.type === "audio/mpeg" ||
      file.type === "audio/wav" ||
      lower.endsWith(".mp3") ||
      lower.endsWith(".wav")
    )
  }

  const uploadOriginalFileToCloud = async (file: File) => {
    setCloudBackupStatus("uploading")
    try {
      const uploadResult = await uploadFiles("kitAudio", { files: [file] })
      const uploaded = uploadResult?.[0]
      if (!uploaded) {
        throw new Error("Upload failed")
      }
      const serverData = uploaded.serverData as { fileUrl?: string; fileKey?: string } | undefined
      setUploadedFileInfo({
        url: serverData?.fileUrl ?? uploaded.ufsUrl ?? uploaded.url,
        key: serverData?.fileKey ?? uploaded.key,
      })
      setCloudBackupStatus("success")
    } catch (error) {
      console.error("UploadThing error:", error)
      // Best-effort only; keep working locally
      setCloudBackupStatus("idle")
      toast({
        title: "Cloud backup skipped",
        description: "Audio is kept local. Re-upload later if you need a cloud copy.",
        variant: "default",
      })
    }
  }

  const prepareAudioFileForSlicing = async (file: File) => {
    if (!isSupportedFile(file)) {
      toast({
        title: "Unsupported file",
        description: "Please upload an MP3 or WAV file.",
        variant: "destructive",
      })
      return
    }

    setCloudBackupStatus("idle")
    setUploadedFileInfo(null)
    void uploadOriginalFileToCloud(file)
    hasAutoDetectedRef.current = false

    if (!audioContextInitialized) {
      await initializeAudioContext()
    }

    clearSlices(false)
    resetSliceHistory()
    setPotentialSlices([])
    setSelectedSliceId(null)

    try {
      setIsProcessing(true)
      const arrayBuffer = await file.arrayBuffer()

      if (!audioContext.current) {
        throw new Error("Audio context not initialized")
      }

      const decodedBuffer = await audioContext.current.decodeAudioData(arrayBuffer.slice(0))

      openTrimPreview(decodedBuffer, file, "upload")
      setIsProcessing(false)

      toast({
        title: "Audio prepared",
        description: "Select a 3-60s window before slicing.",
      })
    } catch (error) {
      console.error("Error decoding audio data:", error)
      setIsProcessing(false)
      toast({
        title: "Error loading file",
        description: "Failed to decode audio file. Please try a different file.",
        variant: "destructive",
      })
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await prepareAudioFileForSlicing(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploadDragActive(true)
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy"
    }
  }

  const handleUploadDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploadDragActive(true)
  }

  const handleUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploadDragActive(false)
  }

  const extractFileFromDataTransfer = (dt: DataTransfer | null): File | null => {
    if (!dt) return null
    if (dt.files && dt.files.length > 0) return dt.files[0]
    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i]
        if (item.kind === "file") {
          const f = item.getAsFile()
          if (f) return f
        }
      }
    }
    return null
  }

  // Capture global drops so dragging anywhere still opens trim dialog
  useEffect(() => {
    const onGlobalDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsUploadDragActive(true)
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
    }
    const onGlobalDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsUploadDragActive(false)
      const file = extractFileFromDataTransfer(e.dataTransfer)
      if (file && isSupportedFile(file)) {
        void prepareAudioFileForSlicing(file)
      }
    }
    const onGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setIsUploadDragActive(false)
    }
    window.addEventListener("dragover", onGlobalDragOver)
    window.addEventListener("dragleave", onGlobalDragLeave)
    window.addEventListener("drop", onGlobalDrop)
    return () => {
      window.removeEventListener("dragover", onGlobalDragOver)
      window.removeEventListener("dragleave", onGlobalDragLeave)
      window.removeEventListener("drop", onGlobalDrop)
    }
    // prepareAudioFileForSlicing is stable enough for this usage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load project by query param using API helper
  useEffect(() => {
    const pid = searchParams.get("projectId")
    if (!pid || projectId === pid) return
    if (!user) {
      toast({
        title: "Login required",
        description: "Sign in to open saved projects.",
        variant: "destructive",
      })
      return
    }

    const loadProject = async () => {
      try {
        setIsProcessing(true)
        setIsProjectLoading(true)
        hasAutoExportedRef.current = false
        setAutoExportQueued(shouldAutoExport)
        const { project, assets } = await loadProjectFromApi(pid)

        setProjectId(project.id)
        if (project.title) setKitName(project.title)

        const sliceSettings = project.slice_settings || {}
        const playbackConfig = project.playback_config || {}

        if (sliceSettings.trimSelection) setTrimSelection(sliceSettings.trimSelection as [number, number])
        if (sliceSettings.gridLayout) setGridLayout(sliceSettings.gridLayout as 1 | 2 | 3 | 4)
        if (typeof sliceSettings.sensitivity === "number") setSensitivity(sliceSettings.sensitivity)
        if (typeof sliceSettings.minDistance === "number") setMinDistance(sliceSettings.minDistance)
        setAuditionEnabled(!!sliceSettings.auditionEnabled)
        if (Array.isArray((sliceSettings as any).kitTags)) {
          setKitTags(((sliceSettings as any).kitTags as string[]).slice(0, 3))
        } else if (Array.isArray((sliceSettings as any).tags)) {
          setKitTags(((sliceSettings as any).tags as string[]).slice(0, 3))
        }
        if ((sliceSettings as any).kitCategory === "loop" || (sliceSettings as any).kitCategory === "drum") {
          setKitCategory((sliceSettings as any).kitCategory)
        }

        if (typeof playbackConfig.volume === "number") setVolume(playbackConfig.volume)
        if (typeof playbackConfig.useOriginalAudio === "boolean") setUseOriginalAudio(playbackConfig.useOriginalAudio)
        if (project.fx_chains) setSliceFx(project.fx_chains)
        if (project.notes) setNotes(project.notes)

        let derivedTrim: [number, number] | null = null

        if (project.kit_slices?.length) {
          const loadedSlices = project.kit_slices.map((s) => ({
            id:
              s.id ||
              (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `slice-${Date.now().toString(36)}`),
            start: Number(s.start_time),
            end: Number(s.end_time),
            type: s.type || "perc",
            name: s.name || "",
            selected: false,
            fadeIn: s.fade_in_ms ?? 0,
            fadeOut: s.fade_out_ms ?? 0,
            fadeInShape: 0,
            fadeOutShape: 0,
            volume: (s.metadata as any)?.volume ?? 1,
          }))
          resetSliceHistory()
          const preparedSlices = shouldAutoExport ? loadedSlices.map((slice) => ({ ...slice, selected: true })) : loadedSlices
          setSlicesWithHistory(preparedSlices, false)
          setSelectedSliceId(preparedSlices[0]?.id ?? null)
          if (shouldAutoExport && preparedSlices.length > 0) {
            setAutoExportQueued(true)
            hasAutoExportedRef.current = false
          }

          const starts = loadedSlices.map((s) => s.start)
          const ends = loadedSlices.map((s) => s.end)
          if (starts.length && ends.length) {
            derivedTrim = [Math.min(...starts), Math.max(...ends)]
          }
        }

        const trimWindow =
          (sliceSettings.trimSelection as [number, number] | undefined) ||
          derivedTrim ||
          null

        const stemAsset =
          assets?.find((a) => a.asset_type === "stem" && (a.signedUrl || a.storage_path)) ||
          assets?.find((a) => a.signedUrl || a.storage_path)

        const isAbsoluteUrl = (value?: string | null) => !!value && /^https?:\/\//i.test(value)

        const candidateUrl = stemAsset?.signedUrl
          ? stemAsset.signedUrl
          : isAbsoluteUrl(stemAsset?.storage_path)
            ? `/api/proxy-audio?url=${encodeURIComponent(stemAsset?.storage_path || "")}`
            : isAbsoluteUrl(project.source_audio_path)
              ? `/api/proxy-audio?url=${encodeURIComponent(project.source_audio_path || "")}`
              : null

        if (candidateUrl || project.source_audio_path) {
          if (!audioContextInitialized) {
            await initializeAudioContext({ showToast: false })
          }
          if (audioContext.current) {
            try {
              const res = await fetch(candidateUrl ?? "")
              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer()
                const decoded = await audioContext.current.decodeAudioData(arrayBuffer.slice(0))
                const trimmed =
                  trimWindow && trimWindow.length === 2
                    ? sliceAudioBuffer(decoded, Number(trimWindow[0]), Number(trimWindow[1]))
                    : decoded

                if (trimWindow) {
                  setTrimSelection([Number(trimWindow[0]), Number(trimWindow[1])])
                }

                setAudioBuffer(trimmed)
                setOriginalAudioBuffer(trimmed)
                setUploadedFileInfo({ url: project.source_audio_path || stemAsset?.storage_path || "", key: "" })
              } else {
                throw new Error(`Audio fetch failed (${res.status})`)
              }
            } catch (err) {
              console.warn("Failed to load project audio", err)
              toast({
                title: "Could not load audio",
                description: "Saved project found, but audio could not be fetched.",
                variant: "destructive",
              })
            }
          } else {
            toast({
              title: "Audio context not ready",
              description: "Could not initialize audio playback.",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "No audio found",
            description: "Saved project loaded, but no audio path was available. Try re-uploading or re-saving the project.",
            variant: "destructive",
          })
        }

        if (candidateUrl) {
          toast({
            title: "Project loaded",
            description: "Continue editing your saved session.",
          })
        }
      } catch (err) {
        console.error(err)
        toast({
          title: "Failed to load project",
          description: err instanceof Error ? err.message : "Could not load project",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
        setIsProjectLoading(false)
      }
    }

    void loadProject()
  }, [searchParams, user, projectId, toast, audioContextInitialized, shouldAutoExport])

  useEffect(() => {
    if (!shouldAutoExport) return
    if (!autoExportQueued) return
    if (hasAutoExportedRef.current) return
    if (isProjectLoading || isProcessing) return
    if (!audioBuffer || slices.length === 0) return

    hasAutoExportedRef.current = true
    setAutoExportStatus("preparing")
    void exportSlices({ autoReturn: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoExport, autoExportQueued, isProjectLoading, isProcessing, audioBuffer, slices])

  useEffect(() => {
    if (!searchParams.get("fresh")) return
    stopPlayback()
    stopPreviewPlayback()
    setProjectId(null)
    setKitId(null)
    setKitName("")
    setHasCustomKitName(false)
    setKitTags([])
    setKitCategory("drum")
    clearSlices(false)
    resetSliceHistory()
    setPotentialSlices([])
    setSelectedSliceId(null)
    setAudioBuffer(null)
    setOriginalAudioBuffer(null)
    setUploadedFileInfo(null)
    setNotes("")
  }, [searchParams])

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploadDragActive(false)

    let file: File | null = null
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0]
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (item.kind === "file") file = item.getAsFile()
    }

    if (file && isSupportedFile(file)) {
      await prepareAudioFileForSlicing(file)
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an MP3 or WAV file",
        variant: "destructive",
      })
    }
  }

  const handleStartOver = () => {
    stopPreviewPlayback()
    setShowTrimPreview(false)
    hasAutoDetectedRef.current = false
    setPendingAudioBuffer(null)
    setPendingAudioFile(null)
    setUploadedFileInfo(null)
    setCloudBackupStatus("idle")
    setDetectedOutputs([])
    setTrimSelection([0, 0])
    if (pendingAudioSource === "record") {
      void startRecording()
    } else if (pendingAudioSource === "upload") {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
        fileInputRef.current.click()
      }
    } else if (pendingAudioSource === "youtube") {
      toast({
        title: "Paste another link",
        description: "Drop a new YouTube URL to extract fresh audio.",
      })
    }
    setPendingAudioSource(null)
  }

  const handleLoadNewAudio = () => {
    stopPlayback()
    stopPreviewPlayback()
    hasAutoDetectedRef.current = false
    setAudioBuffer(null)
    setOriginalAudioBuffer(null)
    setPendingAudioBuffer(null)
    setPendingAudioFile(null)
    setPendingAudioSource(null)
    clearSlices(false)
    resetSliceHistory()
    setPotentialSlices([])
    setSelectedSliceId(null)
    setDetectedOutputs([])
    setTrimSelection([0, 0])
    setUploadedFileInfo(null)
    setCloudBackupStatus("idle")
    setShowTrimPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
      fileInputRef.current.click()
    }
  }

  // Extract drum stem from audio file using external API
  const extractDrumStem = async (audioFile: File) => {
    if (!audioContext.current) return

    try {
      setIsStemExtracting(1)
      setShowExtractionDialog(true)

      // Always use the extraction function which calls the secure API route
      const result = await extractDrumsWithLalalAI(
        audioFile,
        audioContext.current,
        (progress: ExtractionProgress) => {
          setExtractionProgress(progress)
        },
        { userId: user?.id, projectId: projectId || undefined, kitId: kitId || undefined },
      )

      if (result.success && result.audioBuffer) {
        // Force using extracted stem buffer
        setUseOriginalAudio(false)
        setAudioBuffer(result.audioBuffer)
        setDetectedOutputs(["drum-kit"] as KitOutputId[])
        if (result.stemUrl) {
          setUploadedFileInfo({ url: result.stemUrl, key: "" })
        }

        toast({
          title: "Drum extraction complete",
          description: "Drum stem extracted successfully",
        })

        // Auto-run slicing on the extracted stem buffer
        try {
          await detectSlices(result.audioBuffer)
        } catch (sliceError) {
          console.error("Auto slicing failed after extraction:", sliceError)
        }

        // Auto-close dialog after 2 seconds on success
        setTimeout(() => {
          setShowExtractionDialog(false)
        }, 2000)
      } else {
        throw new Error(result.error || "Extraction failed")
      }

      setIsStemExtracting(0)
    } catch (error) {
      console.error("Error extracting drum stem:", error)
      setIsStemExtracting(0)

      toast({
        title: "Extraction error",
        description: error instanceof Error ? error.message : "Failed to extract drum stem",
        variant: "destructive",
      })

      // Close dialog on error
      setTimeout(() => {
        setShowExtractionDialog(false)
      }, 3000)
    }
  }

  // Start recording audio
  const startRecording = async () => {
    // Initialize audio context if not already done
    if (!audioContextInitialized) {
      await initializeAudioContext()
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      mediaRecorderRef.current = new MediaRecorder(stream)
      recordedChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" })
        const arrayBuffer = await blob.arrayBuffer()

        try {
          if (!audioContext.current) {
            throw new Error("Audio context not initialized")
          }

          const decodedBuffer = await audioContext.current.decodeAudioData(arrayBuffer.slice(0))

          // Convert to WAV so we can reuse the upload + processing pipeline
          const wavBlob = await bufferToWav(decodedBuffer)
          const file = new File([wavBlob], "recording.wav", { type: "audio/wav" })

          // Run through the same prepare flow (uploads to UploadThing)
          await prepareAudioFileForSlicing(file)

          // Keep existing trim preview UX
          clearSlices(false)
          resetSliceHistory()
          setPotentialSlices([])
          setSelectedSliceId(null)
          openTrimPreview(decodedBuffer, file, "record")

          toast({
            title: "Recording captured",
            description: "Trim the best 3-60 seconds before slicing.",
          })
        } catch (error) {
          console.error("Error decoding recorded audio:", error)
          toast({
            title: "Recording error",
            description: "Failed to process recorded audio.",
            variant: "destructive",
          })
        }

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())

        setIsRecording(false)
        setRecordingTime(0)
        stopRecordingTimer()
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)
      recordingStartRef.current = performance.now()
      const updateRecordingTime = () => {
        if (!recordingStartRef.current) return
        const elapsed = (performance.now() - recordingStartRef.current) / 1000
        setRecordingTime(Number(elapsed.toFixed(1)))
        if (elapsed >= 60) {
          stopRecording()
          return
        }
        recordingRafRef.current = requestAnimationFrame(updateRecordingTime)
      }
      recordingRafRef.current = requestAnimationFrame(updateRecordingTime)

      toast({
        title: "Recording started",
        description: "Recording audio from your microphone",
      })
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone error",
        description: "Failed to access microphone. Please check your permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    stopRecordingTimer()
  }

  // Find potential transients without creating slices
  const findPotentialTransients = (
    audioData: Float32Array,
    sampleRate: number,
    sensitivity: number,
    minDistance: number,
  ): number[] => {
    const transients: number[] = []
    const windowSize = 1024
    const hopSize = 512

    // Calculate energy for each window
    const energies: number[] = []
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      let energy = 0
      for (let j = 0; j < windowSize; j++) {
        energy += audioData[i + j] * audioData[i + j]
      }
      energies.push(energy / windowSize)
    }

    // Calculate energy derivative
    const derivatives: number[] = []
    for (let i = 1; i < energies.length; i++) {
      derivatives.push(energies[i] - energies[i - 1])
    }

    // Find peaks in the derivative
    const minSampleDistance = minDistance * sampleRate
    let lastPeakPos = -minSampleDistance

    // Find the maximum derivative value to normalize sensitivity
    let maxDerivative = 0
    for (let i = 0; i < derivatives.length; i++) {
      if (derivatives[i] > maxDerivative) {
        maxDerivative = derivatives[i]
      }
    }

    // Use a relative threshold based on the maximum derivative
    const threshold = sensitivity * maxDerivative * 0.1

    for (let i = 1; i < derivatives.length - 1; i++) {
      if (
        derivatives[i] > threshold &&
        derivatives[i] > derivatives[i - 1] &&
        derivatives[i] > derivatives[i + 1] &&
        i * hopSize - lastPeakPos >= minSampleDistance
      ) {
        const positionInSeconds = (i * hopSize) / sampleRate
        transients.push(positionInSeconds)
        lastPeakPos = i * hopSize
      }
    }

    return transients
  }

  // Detect slices based on transients
  const detectSlices = async (bufferArg?: AudioBuffer) => {
    const buffer = bufferArg ?? audioBuffer
    if (!buffer || typeof (buffer as any).getChannelData !== "function" || buffer.duration === 0) {
      toast({
        title: "No audio",
        description: "Load audio before detecting slices.",
        variant: "destructive",
      })
      return
    }

    // Ensure audio context is initialized
    if (!audioContextInitialized) {
      await initializeAudioContext()
    }

    setIsProcessing(true)

    try {
      // Get audio data from the buffer
      const audioData = buffer.getChannelData(0)
      const sampleRate = buffer.sampleRate

      // Use the current potential slices or detect them if none exist
      let transients = potentialSlices
      if (transients.length === 0) {
        transients = findPotentialTransients(audioData, sampleRate, sensitivity, minDistance)
      }

      // Create slices from transients
      const typeCounters: Record<string, number> = {} // Track count of each type
      const newSlices = transients.map((position, index) => {
        // Determine end position (either next transient or +200ms)
        const nextPosition = transients[index + 1] ? transients[index + 1] : position + 0.2
        const end = Math.min(nextPosition, position + 0.2)

        // Guess the drum type based on frequency content
        const type = classifyDrumSound(audioData, sampleRate, position, end)

        // Increment counter for this type
        typeCounters[type] = (typeCounters[type] || 0) + 1

        // Generate a name based on the kit prefix and type
        const name = `${kitPrefix}_${capitalizeFirstLetter(type)}_${typeCounters[type]}`

        return {
          id: `slice-${index}`,
          start: position,
          end: end,
          type: type,
          name: name,
          selected: true, // Selected by default for export
          fadeIn: 5,
          fadeOut: 10,
          fadeInShape: 0, // Default to linear fade
          fadeOutShape: 0, // Default to linear fade
        }
      })

      setSlicesWithHistory(newSlices)
      renumberSlicesByType(newSlices)
      // Switch to extracted view after detection
      setIsProcessing(false)

      toast({
        title: "Slices detected",
        description: `${newSlices.length} slices found`,
      })
    } catch (error) {
      console.error("Error detecting slices:", error)
      setIsProcessing(false)
      hasAutoDetectedRef.current = false
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "An error occurred while processing the audio.",
        variant: "destructive",
      })
    }
  }

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  // Classify drum sound based on audio characteristics
  const classifyDrumSound = (audioData: Float32Array, sampleRate: number, start: number, end: number): string => {
    // Convert time positions to sample indices
    const startSample = Math.floor(start * sampleRate)
    const endSample = Math.floor(end * sampleRate)
    const length = endSample - startSample

    if (length <= 0) return "perc"

    // Extract the sample data
    const sampleData = audioData.slice(startSample, endSample)

    // Calculate RMS energy
    let sumSquared = 0
    for (let i = 0; i < sampleData.length; i++) {
      sumSquared += sampleData[i] * sampleData[i]
    }
    const rms = Math.sqrt(sumSquared / sampleData.length)

    // Calculate zero-crossing rate
    let zeroCrossings = 0
    for (let i = 1; i < sampleData.length; i++) {
      if ((sampleData[i] >= 0 && sampleData[i - 1] < 0) || (sampleData[i] < 0 && sampleData[i - 1] >= 0)) {
        zeroCrossings++
      }
    }
    const zcr = zeroCrossings / sampleData.length

    // Simplified classification based on zero-crossing rate and duration
    if (zcr < 0.05 && rms > 0.1) {
      return "kick"
    } else if (zcr > 0.1 && zcr < 0.2) {
      return "snare"
    } else if (zcr > 0.2) {
      return "hat"
    } else if (zcr > 0.15 && end - start > 0.15) {
      return "tom"
    } else if (zcr > 0.2 && end - start > 0.2) {
      return "cymb"
    } else {
      return "perc"
    }
  }

  const triggerAuditionForKey = (inputKey: string) => {
    if (!auditionEnabled) return
    const normalizedKey = inputKey.toLowerCase()
    const padIndex = AUDITION_KEY_ORDER.indexOf(normalizedKey)
    if (padIndex === -1) return
    const targetSlice = slices[padIndex]
    if (!targetSlice) return

    setSelectedSliceId(targetSlice.id)
    setActiveAuditionKey(normalizedKey)
    void playSlice(targetSlice.id)
  }

  const buildProjectPayload = () => {
    const fallbackName = `${kitPrefix}_${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    const nameToPersist = kitName.trim() || fallbackName
    return {
      projectId: projectId || undefined,
      title: nameToPersist,
      sourceAudioPath: uploadedFileInfo?.url,
      sourceDuration: audioBuffer?.duration,
      sliceSettings: {
        sensitivity,
        minDistance,
        trimSelection,
        gridLayout,
        auditionEnabled,
        kitTags,
        kitCategory,
      },
      playbackConfig: {
        volume,
        useOriginalAudio,
      },
      fxChains: sliceFx,
      notes,
      slices: slices.map((s) => ({
        id: s.id, // keep client id for now; backend will generate if missing
        name: s.name,
        type: s.type,
        start_time: s.start,
        end_time: s.end,
        fade_in_ms: s.fadeIn,
        fade_out_ms: s.fadeOut,
        metadata: {},
      })),
    }
  }

  const saveProject = async () => {
    setIsSavingProject(true)
    try {
      const payload = buildProjectPayload()
      const data = await saveProjectToApi(payload)
      const newId = data.projectId
      setProjectId(newId)
      return newId
    } finally {
      setIsSavingProject(false)
    }
  }

  const handleSaveProject = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in to save your project.",
        variant: "destructive",
      })
      return
    }
    try {
      const id = await saveProject()
      toast({
        title: "Project saved",
        description: "Find it later under My Projects.",
      })
      return id
    } catch (error) {
      console.error(error)
      toast({
        title: "Save failed",
        description: "Could not save project. Please try again.",
        variant: "destructive",
      })
      return null
    }
  }

  const handleSaveAsProject = async () => {
    // Reset projectId to force creation of a new project
    setProjectId(null)
    await handleSaveProject()
  }

  const handleSaveToLibrary = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in to save to library.",
        variant: "destructive",
      })
      return
    }
    if (slices.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Create at least one slice before saving.",
        variant: "destructive",
      })
      return
    }
    setIsSavingKit(true)
    try {
      const ensuredProjectId = projectId || (await saveProject())
      if (!ensuredProjectId) throw new Error("Project save failed")

      const fallbackName = `${kitPrefix}_${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      const nameToPersist = kitName.trim() || fallbackName

      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: ensuredProjectId,
          kitId: kitId || undefined,
          name: nameToPersist,
          description: notes || "",
          visibility: "private",
        }),
      })

      const text = await response.text()
      console.log("Save library response", response.status, text)
      const json = text ? JSON.parse(text) : {}
      if (!response.ok) {
        throw new Error(json.error || text || "Failed to save to library")
      }

      const data = json
      if (data.kitId) setKitId(data.kitId)

      toast({
        title: "Saved to library",
        description: "Project saved and kit added to My Library.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Save failed",
        description: "Could not save to library. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingKit(false)
    }
  }

  // Handle slice selection
  const handleSliceClick = (sliceId: string) => {
    // If clicking the already selected slice, deselect it
    if (sliceId === selectedSliceId) {
      setSelectedSliceId(null)
    } else {
      // Play the slice immediately without waiting for state update
      playSlice(sliceId)
    }
  }

  // Play/pause audio
  const togglePlayback = async () => {
    // Ensure audio context is initialized
    if (!audioContextInitialized) {
      await initializeAudioContext()
    }

    if (isPlaying) {
      pausePlayback()
    } else {
      if (isPaused) {
        await resumePlayback()
      } else {
        await startPlayback()
      }
    }
  }

  // Start audio playback
  const startPlayback = async (startTime = 0) => {
    if (!audioBuffer || !audioContext.current) {
      toast({
        title: "Playback error",
        description: "Audio not loaded or audio context not initialized",
        variant: "destructive",
      })
      return
    }

    // Resume audio context if suspended/interrupted (needed for iOS/mobile)
    if (audioContext.current.state !== "running") {
      try {
        await audioContext.current.resume()
      } catch (error) {
        console.error("[Audio] Failed to resume AudioContext before playback:", error)
        toast({
          title: "Playback blocked",
          description: "Tap the screen to enable audio, then try again.",
          variant: "destructive",
        })
        return
      }
    }

    // Stop any current playback
    if (sourceNode.current) {
      sourceNode.current.stop()
    }

    // Create a new source node
    sourceNode.current = audioContext.current.createBufferSource()
    sourceNode.current.buffer = audioBuffer

    // Connect to output
    sourceNode.current.connect(gainNode.current!)
    gainNode.current!.connect(audioContext.current.destination)

    // Start playback
    const currentTime = audioContext.current.currentTime
    sourceNode.current.start(0, startTime)
    playbackStartTime.current = currentTime - startTime
    pausedTime.current = 0

    // Update state
    setIsPlaying(true)
    setIsPaused(false)
    setCurrentPlaybackTime(startTime)

    // Start animation frame for updating playback position
    const updatePlaybackPosition = () => {
      if (!audioContext.current) return

      const elapsedTime = audioContext.current.currentTime - playbackStartTime.current

      if (elapsedTime < audioBuffer.duration) {
        setCurrentPlaybackTime(elapsedTime)
        animationFrameId.current = requestAnimationFrame(updatePlaybackPosition)
      } else {
        setIsPlaying(false)
        setIsPaused(false)
        setCurrentPlaybackTime(0)
      }
    }

    animationFrameId.current = requestAnimationFrame(updatePlaybackPosition)
  }

  // Pause audio playback
  const pausePlayback = () => {
    if (!audioContext.current || !sourceNode.current) return

    // Store the current playback position
    pausedTime.current = currentPlaybackTime

    // Stop the source node
    try {
      sourceNode.current.stop()
    } catch (e) {
      // Ignore errors when stopping - the node might not be started
    }
    sourceNode.current = null

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }

    setIsPlaying(false)
    setIsPaused(true)
  }

  // Resume audio playback from paused position
  const resumePlayback = async () => {
    await startPlayback(pausedTime.current)
  }

  // Stop audio playback
  const stopPlayback = () => {
    if (sourceNode.current) {
      try {
        sourceNode.current.stop()
      } catch (e) {
        // Ignore errors when stopping - the node might not be started
      }
      sourceNode.current = null
    }

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }

    setIsPlaying(false)
    setIsPaused(false)
    setCurrentPlaybackTime(0)
    pausedTime.current = 0
  }

  // Play a specific slice
  const playSlice = async (sliceId: string) => {
    console.log('[Audio] playSlice called, sliceId:', sliceId)
    // Ensure audio context is initialized
    if (!audioContextInitialized) {
      console.log('[Audio] AudioContext not initialized, initializing now...')
      await initializeAudioContext()
    }

    const slice = slices.find((s) => s.id === sliceId)
    if (!slice) {
      console.error('[Audio] Slice not found:', sliceId)
      return
    }
    if (!audioBuffer) {
      console.error('[Audio] No audio buffer available')
      return
    }
    if (!audioContext.current) {
      console.error('[Audio] AudioContext is null')
      return
    }

    console.log('[Audio] Playing slice:', slice.name, 'duration:', (slice.end - slice.start) * 1000, 'ms')
    console.log('[Audio] AudioContext state before resume:', audioContext.current.state)

    // Set this slice as selected first for immediate visual feedback
    setSelectedSliceId(sliceId)

    // CRITICAL FOR MOBILE: Always try to resume AudioContext before playback
    // This is required for iOS Safari and mobile browsers
    try {
      if (audioContext.current.state !== "running") {
        console.log('[Audio] AudioContext not running, attempting to resume...')
        await audioContext.current.resume()
        console.log('[Audio] AudioContext resumed successfully, state:', audioContext.current.state)
      }
    } catch (error) {
      console.error('[Audio] Failed to resume AudioContext:', error)
      toast({
        title: "Audio Error",
        description: "Could not initialize audio playback. Try tapping the screen first.",
        variant: "destructive",
      })
      return
    }

    // Stop any current playback
    if (sourceNode.current) {
      try {
        sourceNode.current.stop()
      } catch (e) {
        // Ignore errors when stopping - the node might not be started
      }
      sourceNode.current = null
    }

    // Calculate buffer parameters
    const startSample = Math.floor(slice.start * audioBuffer.sampleRate)
    const endSample = Math.floor(slice.end * audioBuffer.sampleRate)
    const length = endSample - startSample

    // Create a new source node immediately
    sourceNode.current = audioContext.current.createBufferSource()

    // Create a gain node for this slice
    const sliceGainNode = audioContext.current.createGain()
    const sliceFxSettings = sliceFx[slice.id] || defaultFxSettings()
    const fxGain = sliceFxSettings.volume.active ? dbToGain(sliceFxSettings.volume.gain) : 1
    const baseVolume = isMuted ? 0 : volume
    const effectiveVolume = Math.max(0, baseVolume * fxGain)
    sliceGainNode.gain.value = effectiveVolume

    console.log('[Audio] Created source node and gain node, volume:', volume, 'effective volume:', effectiveVolume, 'muted:', isMuted)
    console.log('[Audio] Gain value set to:', sliceGainNode.gain.value)

    // Build FX chain for this slice
    let lastNode: AudioNode = sourceNode.current

    // EQ
    const eqNodes = createEqFilters(audioContext.current, sliceFxSettings.eq)
    eqNodes.forEach((node) => {
      lastNode.connect(node)
      lastNode = node
    })

    // Compressor
    const comp = createCompressor(audioContext.current, sliceFxSettings.comp)
    if (comp) {
      lastNode.connect(comp.input)
      lastNode = comp.output
    }

    // Color (saturation with mix)
    const color = createColor(audioContext.current, sliceFxSettings.color)
    if (color) {
      lastNode.connect(color.shaper)
      lastNode.connect(color.dryGain)
      color.shaper.connect(color.wetGain)
      const mixMerge = audioContext.current.createGain()
      color.dryGain.connect(mixMerge)
      color.wetGain.connect(mixMerge)
      mixMerge.connect(color.postGain)
      lastNode = color.postGain
    }

    // CRITICAL FOR MOBILE: Connect audio graph explicitly
    try {
      lastNode.connect(sliceGainNode)
      sliceGainNode.connect(audioContext.current.destination)
      console.log('[Audio] Audio nodes connected to destination successfully')
    } catch (error) {
      console.error('[Audio] Failed to connect audio nodes:', error)
      toast({
        title: "Audio Error",
        description: "Failed to connect audio nodes",
        variant: "destructive",
      })
      return
    }

    // Create the slice buffer asynchronously but start playback as soon as possible
    const sliceBuffer = audioContext.current.createBuffer(audioBuffer.numberOfChannels, length, audioBuffer.sampleRate)

    // Process audio data in chunks to avoid blocking the main thread
    const processAudioData = () => {
      // Copy data from original buffer to slice buffer with fades applied
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel)
        const sliceData = sliceBuffer.getChannelData(channel)

        // Apply fade in
        const fadeInSamples = Math.floor((slice.fadeIn / 1000) * audioBuffer.sampleRate)

        // Apply fade out
        const fadeOutSamples = Math.floor((slice.fadeOut / 1000) * audioBuffer.sampleRate)

        for (let i = 0; i < length; i++) {
          // Get the sample from the original buffer
          let sample = originalData[startSample + i]

          // Apply fade in
          if (i < fadeInSamples && fadeInSamples > 0) {
            const fadeInGain = i / fadeInSamples
            sample *= fadeInGain
          }

          // Apply fade out
          if (i > length - fadeOutSamples && fadeOutSamples > 0) {
            const fadeOutGain = (length - i) / fadeOutSamples
            sample *= fadeOutGain
          }

          sliceData[i] = sample
        }
      }

      applyLowCut300Hz(sliceBuffer, slice.type)

      // Set the buffer and start playback
      if (sourceNode.current) {
        sourceNode.current.buffer = sliceBuffer
        console.log('[Audio] Starting playback now...')
        console.log('[Audio] AudioContext state right before start():', audioContext.current?.state)
        console.log('[Audio] Destination channels:', audioContext.current?.destination.channelCount)
        console.log('[Audio] Sample rate:', audioContext.current?.sampleRate)

        try {
          sourceNode.current.start(0)
          console.log('[Audio] Playback started successfully')
          console.log('[Audio] Source node state after start - should be playing')
        } catch (error) {
          console.error('[Audio] FAILED to start source node:', error)
          toast({
            title: "Playback Error",
            description: "Failed to start audio playback. " + (error as Error).message,
            variant: "destructive",
          })
        }
      }
    }

    // Process audio data immediately
    processAudioData()

    // Set timeout to update state when playback ends
    setTimeout(
      () => {
        sourceNode.current = null
      },
      (slice.end - slice.start) * 1000,
    )
  }

  useEffect(() => {
    if (!auditionEnabled) {
      auditionPressedKeysRef.current.clear()
      return
    }

    const isTextField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      return tag === "input" || tag === "textarea" || target.isContentEditable || target.getAttribute("role") === "textbox"
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTyping || isTextField(event.target)) return
      const key = event.key.toLowerCase()
      if (!AUDITION_KEY_ORDER.includes(key)) return

      if (auditionPressedKeysRef.current.has(key)) {
        event.preventDefault()
        return
      }

      auditionPressedKeysRef.current.add(key)
      event.preventDefault()
      triggerAuditionForKey(key)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isTextField(event.target)) return
      const key = event.key.toLowerCase()
      if (!AUDITION_KEY_ORDER.includes(key)) return

      auditionPressedKeysRef.current.delete(key)
      setActiveAuditionKey((current) => (current === key ? null : current))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      auditionPressedKeysRef.current.clear()
      setActiveAuditionKey(null)
    }
  }, [auditionEnabled, triggerAuditionForKey])

  // Helper functions for export
  const bufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numberOfChannels = buffer.numberOfChannels
      const length = buffer.length * numberOfChannels * 2
      const sampleRate = buffer.sampleRate

      // Create the WAV file header
      const wavHeader = new ArrayBuffer(44)
      const view = new DataView(wavHeader)

      // "RIFF" chunk descriptor
      writeString(view, 0, "RIFF")
      view.setUint32(4, 36 + length, true)
      writeString(view, 8, "WAVE")

      // "fmt " sub-chunk
      writeString(view, 12, "fmt ")
      view.setUint32(16, 16, true) // fmt chunk size
      view.setUint16(20, 1, true) // audio format (1 for PCM)
      view.setUint16(22, numberOfChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numberOfChannels * 2, true) // byte rate
      view.setUint16(32, numberOfChannels * 2, true) // block align
      view.setUint16(34, 16, true) // bits per sample

      // "data" sub-chunk
      writeString(view, 36, "data")
      view.setUint32(40, length, true)

      // Create the audio data
      const audioData = new Int16Array(buffer.length * numberOfChannels)

      // Interleave the channels
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel)
        for (let i = 0; i < buffer.length; i++) {
          // Convert float to int16
          const sample = Math.max(-1, Math.min(1, channelData[i]))
          audioData[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        }
      }

      // Combine header and audio data
      const wavBlob = new Blob([wavHeader, audioData], { type: "audio/wav" })
      resolve(wavBlob)
    })
  }

  const bufferToMp3 = async (buffer: AudioBuffer): Promise<Blob> => {
    // Simplified MP3 encoding (in a real app, use a proper encoder)
    return bufferToWav(buffer) // Fallback to WAV for this demo
  }

  const generateMidiFile = (slices: Slice[]): Blob => {
    // Simplified MIDI generation
    return new Blob(["MIDI data placeholder"], { type: "audio/midi" })
  }

  const generateMetadataFile = (slices: Slice[]): string => {
    let metadata = `${kitName || "Untitled Drum Kit"} - Metadata\n`
    metadata += `====================\n\n`
    metadata += `Slices: ${slices.length}\n\n`

    slices.forEach((slice, index) => {
      metadata += `${index + 1}. ${slice.name}\n`
      metadata += `   Type: ${slice.type}\n`
      metadata += `   Duration: ${(slice.end - slice.start).toFixed(3)}s\n\n`
    })

    return metadata
  }

  // Helper function to write string to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  // Export selected slices
  const exportSlices = async (options?: { autoReturn?: boolean }) => {
    const autoReturn = options?.autoReturn ?? false
    if (!audioBuffer || slices.length === 0) return

    const selectedSlices = slices.filter((slice) => slice.selected)
    if (selectedSlices.length === 0) {
      toast({
        title: "Export error",
        description: "No slices selected for export",
        variant: "destructive",
      })
      if (autoReturn) {
        setAutoExportStatus("idle")
        setAutoExportQueued(false)
        hasAutoExportedRef.current = true
      }
      return
    }

    if (autoReturn) {
      setAutoExportStatus("preparing")
    }
    setIsProcessing(true)

    try {
      // Create a zip file with all samples
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()

      // Group slices by type
      const slicesByType: Record<string, Slice[]> = {}
      selectedSlices.forEach((slice) => {
        if (!slicesByType[slice.type]) {
          slicesByType[slice.type] = []
        }
        slicesByType[slice.type].push(slice)
      })

      // Process each selected slice
      const promises = selectedSlices.map(async (slice) => {
        try {
          // Extract the slice from the audio buffer
          const startSample = Math.floor(slice.start * audioBuffer.sampleRate)
          const endSample = Math.floor(slice.end * audioBuffer.sampleRate)
          const length = endSample - startSample

          // Create a new buffer for this slice
          const sliceBuffer = audioContext.current!.createBuffer(
            audioBuffer.numberOfChannels,
            length,
            audioBuffer.sampleRate,
          )

          // Copy data from original buffer to slice buffer
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const originalData = audioBuffer.getChannelData(channel)
            const sliceData = sliceBuffer.getChannelData(channel)

            // Apply fade in
            const fadeInSamples = Math.floor((slice.fadeIn / 1000) * audioBuffer.sampleRate)

            // Apply fade out
            const fadeOutSamples = Math.floor((slice.fadeOut / 1000) * audioBuffer.sampleRate)

            for (let i = 0; i < length; i++) {
              // Get the sample from the original buffer
              let sample = originalData[startSample + i]

              // Apply fade in
              if (i < fadeInSamples && fadeInSamples > 0) {
                const fadeInGain = i / fadeInSamples
                sample *= fadeInGain
              }

              // Apply fade out
              if (i > length - fadeOutSamples && fadeOutSamples > 0) {
                const fadeOutGain = (length - i) / fadeOutSamples
                sample *= fadeOutGain
              }

              sliceData[i] = sample
            }
          }

          applyLowCut300Hz(sliceBuffer, slice.type)

          // Convert buffer to audio format
          const audioBlob = exportFormat === "wav" ? await bufferToWav(sliceBuffer) : await bufferToMp3(sliceBuffer)

          // Add to zip in a subfolder based on type
          const folderName = capitalizeFirstLetter(slice.type)
          zip.file(`${folderName}/${slice.name}.${exportFormat}`, audioBlob)
        } catch (error) {
          console.error(`Error processing slice ${slice.id}:`, error)
        }
      })

      // Generate MIDI file if requested
      if (includeMidi) {
        const midiData = generateMidiFile(selectedSlices)
        zip.file(`${kitPrefix}_MIDI_Map.mid`, midiData)
      }

      // Generate metadata file if requested
      if (includeMetadata) {
        const metadata = generateMetadataFile(selectedSlices)
        zip.file(`${kitPrefix}_metadata.txt`, metadata)

        // Also create a metadata file for each type
        Object.entries(slicesByType).forEach(([type, typeSlices]) => {
          const typeMetadata = generateTypeMetadataFile(type, typeSlices)
          zip.file(`${capitalizeFirstLetter(type)}/${type}_metadata.txt`, typeMetadata)
        })
      }

      // Generate and download the zip file
      await Promise.all(promises)
      const content = await zip.generateAsync({ type: "blob" })

      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = `${kitName || "Untitled_Drum_Kit"}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setIsProcessing(false)
      if (autoReturn) {
        setAutoExportStatus("idle")
        setAutoExportQueued(false)
        if (typeof window !== "undefined" && autoReturnMode === "popup") {
          window.opener?.postMessage({ type: "drumkitzz:autoExport:complete" }, "*")
          setTimeout(() => window.close(), 300)
        } else {
          setTimeout(() => {
            router.push("/my-projects")
          }, 500)
        }
      }
      toast({
        title: "Export complete",
        description: `${selectedSlices.length} slices exported successfully`,
      })
    } catch (error) {
      console.error("Error exporting slices:", error)
      setIsProcessing(false)
      if (autoReturn) {
        setAutoExportStatus("idle")
        setAutoExportQueued(false)
        if (typeof window !== "undefined" && autoReturnMode === "popup") {
          window.opener?.postMessage(
            { type: "drumkitzz:autoExport:error", message: "Export failed. Please retry from the editor." },
            "*",
          )
        }
      }
      toast({
        title: "Export error",
        description: "An error occurred while exporting slices.",
        variant: "destructive",
      })
    }
  }

  const generateTypeMetadataFile = (type: string, slices: Slice[]): string => {
    let metadata = `${kitName || "Untitled Drum Kit"} - ${capitalizeFirstLetter(type)} Samples\n`
    metadata += `====================\n\n`
    metadata += `${type.toUpperCase()} Slices: ${slices.length}\n\n`

    slices.forEach((slice, index) => {
      metadata += `${index + 1}. ${slice.name}\n`
      metadata += `   Duration: ${(slice.end - slice.start).toFixed(3)}s\n`
      metadata += `   Fade In: ${slice.fadeIn}ms\n`
      metadata += `   Fade Out: ${slice.fadeOut}ms\n\n`
    })

    return metadata
  }

  // Handle marker drag in the main waveform
  const handleMarkerDrag = (sliceId: string, type: "start" | "end", position: number, isDoubleClick = false) => {
    if (isDoubleClick) {
      removeSlice(sliceId)
      return
    }

    const slice = slices.find((s) => s.id === sliceId)
    if (!slice) return

    if (type === "start" && position < slice.end - 0.01) {
      updateSlice(sliceId, { start: position })
    } else if (type === "end" && position > slice.start + 0.01) {
      updateSlice(sliceId, { end: position })
    }
  }

  // Handle waveform click for creating new slices
  const handleWaveformClick = (position: number, isDoubleClick: boolean) => {
    if (isDoubleClick) {
      // Create a new slice with default duration
      const start = Math.max(0, position - 0.05)
      const end = Math.min(audioBuffer!.duration, position + 0.15)
      createNewSlice(start, end)
    } else if (isCreatingSlice) {
      // Finish creating a slice
      if (newSliceStart !== null) {
        const start = Math.min(newSliceStart, position)
        const end = Math.max(newSliceStart, position)
        createNewSlice(start, end)
        setIsCreatingSlice(false)
        setNewSliceStart(null)
      }
    } else {
      // Start creating a slice
      setIsCreatingSlice(true)
      setNewSliceStart(position)
    }
  }

  // Handle waveform mouse up for creating new slices
  const handleWaveformMouseUp = (position: number) => {
    if (isCreatingSlice && newSliceStart !== null) {
      const start = Math.min(newSliceStart, position)
      const end = Math.max(newSliceStart, position)

      // Only create if there's a meaningful duration
      if (end - start > 0.01) {
        createNewSlice(start, end)
      }

      setIsCreatingSlice(false)
      setNewSliceStart(null)
    }
  }

  // Create a new slice
  const createNewSlice = (start: number, end: number) => {
    // Check if the new slice overlaps with existing slices
    const overlaps = slices.some(
      (slice) => (start >= slice.start && start <= slice.end) || (end >= slice.start && end <= slice.end),
    )

    if (overlaps) {
      toast({
        title: "Slice overlap",
        description: "Cannot create overlapping slices",
        variant: "destructive",
      })
      return false
    }

    // Get audio data for classification
    const audioData = audioBuffer!.getChannelData(0)
    const sampleRate = audioBuffer!.sampleRate
    const type = classifyDrumSound(audioData, sampleRate, start, end)

    // Generate a unique ID
    const id = `slice-${Date.now()}`

    // Generate a name based on the kit prefix and type
    const name = generateSliceName(kitPrefix, type, slices)

    // Create the new slice
    const newSlice = {
      id,
      start,
      end,
      type,
      name,
      selected: true,
      fadeIn: 5,
      fadeOut: 10,
      fadeInShape: 0,
      fadeOutShape: 0,
    }

    // Add the new slice to the slices array
    setSlicesWithHistory([...slices, newSlice])
    return true
  }

  // Update slice properties
  const updateSlice = (sliceId: string, updates: Partial<Slice>) => {
    // Find the slice to update
    const sliceIndex = slices.findIndex((slice) => slice.id === sliceId)
    if (sliceIndex === -1) return

    const updatedSlices = [...slices]
    const currentSlice = updatedSlices[sliceIndex]

    // Handle type change - update name and renumber
    if (updates.type !== undefined && updates.type !== currentSlice.type) {
      // Update the slice with the new type
      updatedSlices[sliceIndex] = {
        ...currentSlice,
        ...updates,
        type: updates.type,
      }

      // After changing this slice's type, we need to renumber all slices
      renumberSlicesByType(updatedSlices)

      // Set the updated slices
      setSlicesWithHistory(updatedSlices)
    } else {
      // For non-type updates, just update the slice directly
      setSlicesWithHistory(slices.map((slice) => (slice.id === sliceId ? { ...slice, ...updates } : slice)))
    }
  }

  // Generate a name for a slice based on type and existing slices
  const generateSliceName = (prefix: string, type: string, allSlices: Slice[], currentSliceId?: string): string => {
    // Get all slices of this type, excluding the current slice if provided
    const slicesOfType = allSlices.filter(
      (slice) => slice.type === type && (currentSliceId === undefined || slice.id !== currentSliceId),
    )

    // Find the next available number
    let nextNumber = 1
    const usedNumbers = new Set(
      slicesOfType.map((slice) => {
        // Extract number from the name (e.g., "DK_Kick_3" -> 3)
        const match = slice.name.match(/_(\d+)$/)
        return match ? Number.parseInt(match[1], 10) : 0
      }),
    )

    while (usedNumbers.has(nextNumber)) {
      nextNumber++
    }

    return `${prefix}_${capitalizeFirstLetter(type)}_${nextNumber}`
  }

  // Renumber all slices by type to ensure sequential numbering
  const renumberSlicesByType = (slices: Slice[]): void => {
    // Group slices by type
    const slicesByType: Record<string, Slice[]> = {}

    slices.forEach((slice) => {
      if (!slicesByType[slice.type]) {
        slicesByType[slice.type] = []
      }
      slicesByType[slice.type].push(slice)
    })

    // Sort each group by start time and renumber
    Object.keys(slicesByType).forEach((type) => {
      const typeSlices = slicesByType[type].sort((a, b) => a.start - b.start)

      typeSlices.forEach((slice, index) => {
        slice.name = `${kitPrefix}_${capitalizeFirstLetter(type)}_${index + 1}`
      })
    })
  }

  // Remove slice
  const removeSlice = (sliceId: string) => {
    // Find the slice to remove
    const sliceIndex = slices.findIndex((slice) => slice.id === sliceId)
    if (sliceIndex === -1) return

    // Simply remove the slice without modifying adjacent slices
    const updatedSlices = [...slices]
    updatedSlices.splice(sliceIndex, 1)
    setSlicesWithHistory(updatedSlices)
    setSliceFx((prev) => {
      const next = { ...prev }
      delete next[sliceId]
      return next
    })

    // If this was the selected slice, clear selection
    if (selectedSliceId === sliceId) {
      setSelectedSliceId(null)
    }
  }

  const updateSliceFx = (sliceId: string, updates: Partial<SliceFxSettings>) => {
    setSliceFx((prev) => {
      const existing = prev[sliceId] || defaultFxSettings()
      return {
        ...prev,
        [sliceId]: {
          ...existing,
          ...updates,
        },
      }
    })
  }

  const applyEqPreset = (sliceId: string, presetKey: string) => {
    const preset = EQ_PRESETS[presetKey]
    if (!preset) return
    updateSliceFx(sliceId, {
      eq: {
        ...defaultFxSettings().eq,
        active: true,
        preset: preset.label,
        bands: preset.bands,
      },
    })
  }

  const applyCompPreset = (sliceId: string, presetKey: string) => {
    const preset = COMP_PRESETS[presetKey]
    if (!preset) return
    updateSliceFx(sliceId, {
      comp: {
        ...defaultFxSettings().comp,
        active: true,
        preset: preset.label,
        ...preset.settings,
      },
    })
  }

  const applyColorPreset = (sliceId: string, presetKey: string) => {
    const preset = COLOR_PRESETS[presetKey]
    if (!preset) return
    updateSliceFx(sliceId, {
      color: {
        ...defaultFxSettings().color,
        active: true,
        preset: preset.label,
        ...preset.settings,
      },
    })
  }

  // Handle zoom and scroll changes for individual slices
  const handleSliceZoomChange = (sliceId: string, newZoom: number) => {
    setSliceZoomLevels((prev) => ({
      ...prev,
      [sliceId]: newZoom,
    }))
  }

  const handleSliceScrollChange = (sliceId: string, newScroll: number) => {
    setSliceScrollPositions((prev) => ({
      ...prev,
      [sliceId]: newScroll,
    }))
  }

  // Add handlers for fade shape changes
  const handleFadeInShapeChange = (sliceId: string, newShape: number) => {
    updateSlice(sliceId, { fadeInShape: newShape })
  }

  const handleFadeOutShapeChange = (sliceId: string, newShape: number) => {
    updateSlice(sliceId, { fadeOutShape: newShape })
  }

  const sliceAudioBuffer = (buffer: AudioBuffer, start: number, end: number) => {
    const s = Math.max(0, start)
    const e = Math.min(buffer.duration, end)
    if (e <= s) return buffer
    const sampleRate = buffer.sampleRate
    const startSample = Math.floor(s * sampleRate)
    const endSample = Math.floor(e * sampleRate)
    const frameCount = endSample - startSample
    if (frameCount <= 0) return buffer
    const trimmed = audioContext.current?.createBuffer(buffer.numberOfChannels, frameCount, sampleRate)
    if (!trimmed) return buffer
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel)
      const segment = channelData.subarray(startSample, endSample)
      trimmed.copyToChannel(segment, channel, 0)
    }
    return trimmed
  }

  // Render the landing page or the full application based on whether an audio file is loaded
  if (isProjectLoading && searchParams.get("projectId")) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center p-6" data-build-tag={BUILD_TAG}>
        <div className="space-y-3 text-center text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            {shouldAutoExport ? "Preparing drum kit" : "Loading project"}
          </p>
          <p className="text-xl font-semibold">
            {shouldAutoExport ? "Gathering your slices for download…" : "Fetching your saved slices…"}
          </p>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center p-2 md:p-8 max-w-full overflow-x-hidden" data-build-tag={BUILD_TAG}>
      {shouldAutoExport && autoExportQueued && autoExportStatus === "preparing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="space-y-3 text-center text-white">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#f5d97a]" />
            <p className="text-lg font-semibold">Preparing drum kit…</p>
            <p className="text-sm text-white/60">Gathering your slices and building the download.</p>
          </div>
        </div>
      )}
      {/* Extraction Progress Dialog */}
      <ExtractionProgressDialog
        isOpen={showExtractionDialog}
        progress={extractionProgress}
        onClose={() => setShowExtractionDialog(false)}
      />
      <Dialog
        open={showTrimPreview}
        onOpenChange={(open) => {
          if (!open) {
            setShowTrimPreview(false)
            stopPreviewPlayback()
          }
        }}
      >
        <DialogContent className="w-full max-w-3xl border border-white/10 bg-[#07040d] text-white">
          <DialogHeader>
            <DialogTitle>Trim your audio</DialogTitle>
            <DialogDescription className="text-white/60">
              Choose a 3–60s window before slicing. Drag across the waveform or adjust the handles.
            </DialogDescription>
          </DialogHeader>
          {pendingAudioBuffer && (
            <div className="space-y-4">
              <TrimWaveform
                audioBuffer={pendingAudioBuffer}
                selection={trimSelection}
                playbackTime={previewPlaybackTime}
                className="h-40"
                onSelectRange={(range) => setTrimSelection(normalizeTrimRange(range))}
              />
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-4 text-white/80">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Start</p>
                    <p className="text-lg font-semibold">{trimSelection[0].toFixed(2)}s</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">End</p>
                    <p className="text-lg font-semibold">{Math.min(pendingAudioBuffer.duration, trimSelection[1]).toFixed(2)}s</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Duration</p>
                    <p className="text-lg font-semibold">
                      {(Math.min(pendingAudioBuffer.duration, trimSelection[1]) - trimSelection[0]).toFixed(2)}s
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full border border-white/10 text-white/70 hover:bg-white/10"
                    onClick={() => {
                      if (pendingAudioBuffer) {
                        const end =
                          pendingAudioBuffer.duration < MIN_TRIM_DURATION
                            ? pendingAudioBuffer.duration
                            : Math.min(MAX_TRIM_DURATION, pendingAudioBuffer.duration)
                        setTrimSelection([0, end])
                        stopPreviewPlayback()
                      }
                    }}
                  >
                    Reset selection
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full border border-white/10 text-white hover:border-amber-200/60 hover:text-white"
                    onClick={handleStartOver}
                  >
                    Start over
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full border border-white/10 text-white/80 hover:border-amber-200/60 hover:bg-white/10"
                    onClick={() => {
                      if (isPreviewPlaying) {
                        stopPreviewPlayback()
                      } else {
                        void startPreviewPlayback()
                      }
                    }}
                  >
                    {isPreviewPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span className="sr-only">Pause preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span className="sr-only">Play preview</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  onClick={() => {
                    stopPreviewPlayback()
                    setShowTrimPreview(false)
                    setPendingAudioBuffer(null)
                    setPendingAudioFile(null)
                    setPendingAudioSource(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-full bg-primary text-primary-foreground hover:brightness-110"
                  disabled={trimSelection[1] - trimSelection[0] < MIN_TRIM_DURATION}
                  onClick={commitTrimSelection}
                >
                  Save selection
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {!audioBuffer ? (
        <div className="w-full max-w-6xl space-y-10 px-4 py-6 lg:px-0">
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" className="hidden" onChange={handleFileUpload} />
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.9fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-left shadow-[0_25px_80px_rgba(5,5,7,0.65)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Auto extract</p>
                  <h1 className="font-display text-3xl text-white">Select kit output</h1>
                  <p className="text-sm text-white/60">Enable to choose a stem type before slicing.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/70">
                  <Checkbox
                    id="auto-extract"
                    checked={autoExtractDrums}
                    onCheckedChange={(checked) => setAutoExtractDrums(!!checked)}
                  />
                  <Label htmlFor="auto-extract" className="cursor-pointer text-white">
                    Auto extract
                  </Label>
                </div>
              </div>
              {!autoExtractDrums && (
                <p className="mt-4 text-sm text-white/50">Enable auto extract to unlock stem-specific exports.</p>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {KIT_OUTPUT_OPTIONS.map((option) => {
                      const active = selectedKitOutput === option.id
                      const disabled = option.disabled || !autoExtractDrums
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (!disabled) setSelectedKitOutput(option.id)
                          }}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-amber-400 bg-amber-400/10 text-white"
                              : "border-white/10 bg-black/10 text-white/80 hover:border-amber-200/40"
                          } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{option.title}</p>
                            <span className="text-xs text-white/50">
                              {option.helper}
                            </span>
                          </div>
                          <p className="text-sm text-white/60">{option.description}</p>
                        </button>
                      )
                    })}
              </div>
              {autoExtractDrums &&
                detectedOutputs.length > 0 &&
                !detectedOutputs.includes(selectedKitOutput) && (
                  <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Audio does not contain the selected output. Try another stem type.
                  </div>
                )}
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-left text-white shadow">
                  <div className="flex items-center justify-between text-white/70">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em]">Upload</p>
                      <p className="font-semibold text-white">Drop stems or mixes</p>
                    </div>
                    <Upload className="h-4 w-4 text-white/50" />
                  </div>
                  <div
                    className={`relative mt-4 cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/20 p-4 text-center text-sm text-white/70 transition ${
                      isUploadDragActive ? "border-amber-300/80 shadow-[0_0_24px_rgba(245,217,122,0.4)] ring-2 ring-amber-300/60" : "hover:border-amber-300/60"
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleUploadDragEnter}
                    onDragLeave={handleUploadDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
                        isUploadDragActive ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <div className="absolute inset-0 bg-amber-300/10 blur-lg" />
                      <div className="absolute inset-0 border border-amber-200/60 rounded-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/8 via-transparent to-transparent" />
                    </div>
                    <p className="text-base font-semibold text-white">Select audio</p>
                    <p className="text-xs text-white/60">MP3 or WAV</p>
                    {isUploadDragActive && <p className="mt-2 text-xs font-semibold text-amber-100">Drop to load audio</p>}
                    {cloudBackupStatus !== "idle" && (
                      <p
                        className={`mt-2 text-xs ${
                          cloudBackupStatus === "uploading"
                            ? "text-amber-200"
                            : cloudBackupStatus === "success"
                              ? "text-emerald-200"
                              : "text-red-200"
                        }`}
                      >
                        {cloudBackupStatus === "uploading" && "Uploading to cloud backup..."}
                        {cloudBackupStatus === "success" && "Backed up to UploadThing."}
                        {cloudBackupStatus === "error" && "Cloud backup failed. Audio kept locally."}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-left text-white shadow">
                  <div className="flex items-center justify-between text-white/70">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em]">Record</p>
                      <p className="font-semibold text-white">Capture 5–60s ideas</p>
                    </div>
                    <Mic className="h-4 w-4 text-white/50" />
                  </div>
                  <p className="mt-2 text-xs text-white/60">
                    Capture a melody, groove, or voice note. We’ll auto-trim the noise.
                  </p>
                  <div className="mt-4">
                    {isRecording ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-amber-300">
                          <span className="animate-pulse">●</span>
                          Recording {recordingTime.toFixed(1)}s / 60s
                        </div>
                        <Button onClick={stopRecording} variant="destructive" className="w-full rounded-full">
                          Stop recording
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={startRecording} className="w-full rounded-full bg-amber-400 text-black hover:bg-amber-300">
                        Record audio (5–60s)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-left text-white shadow">
                  <div className="flex items-center justify-between text-white/70">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em]">YouTube</p>
                      <p className="font-semibold text-white">Pull audio from links (Coming soon)</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-center text-sm text-white/60">
                      <span className="text-sm font-semibold text-white">Coming soon</span>
                      <span className="text-xs text-white/50">YouTube import will be back shortly.</span>
                      <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur pointer-events-none" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/60">
                    Need lossless results? Use upload for highest fidelity. YouTube import is coming soon.
                  </p>
                </div>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-[#12100b] to-[#18140a] p-8 text-left shadow-[0_25px_80px_rgba(8,6,2,0.6)]">
            <Badge className="bg-white/10 text-white">Slicer flow v2</Badge>
            <h2 className="mt-4 font-display text-3xl text-white">Slice faster. Sound richer. Drop kits that feel like tomorrow.</h2>
            <p className="mt-3 text-white/70">
              DrumKitzz reimagines extraction with glass control rooms, gradient overlays, and AI metadata that’s marketplace ready.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!isAuthenticated && (
                <Button
                  className="rounded-full bg-amber-400 text-black hover:bg-amber-300"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("open-auth-overlay", { detail: { mode: "signup" } }))
                  }
                >
                  Sign up
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-full border border-white/30 text-white hover:bg-white/10"
                onClick={() => router.push("/marketplace")}
              >
                Explore kits
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/60">Scroll down to see today’s featured kits.</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto space-y-10 px-4 py-6 lg:px-0">
          <div className="flex justify-center">
            <section className="w-full max-w-4xl rounded-[40px] border border-white/10 bg-gradient-to-br from-[#050506] via-[#0a070f] to-[#040307] p-6 text-white shadow-[0_35px_120px_rgba(0,0,0,0.55)] space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Kit Session</p>
                  {isEditingKitName ? (
                    <input
                      type="text"
                      value={kitName}
                      onChange={handleKitNameChange}
                      onFocus={() => setIsTyping(true)}
                      onBlur={handleKitNameBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setIsEditingKitName(false)
                          setIsTyping(false)
                        }
                      }}
                      className="text-2xl font-bold bg-transparent border-b border-amber-300/60 outline-none pb-1"
                      autoFocus
                      placeholder="Untitled Drum Kit"
                    />
                  ) : (
                    <button
                      type="button"
                      className="text-left text-2xl font-bold flex items-center gap-2 hover:text-amber-200 transition"
                      onClick={() => setIsEditingKitName(true)}
                    >
                      {kitName || "Untitled Drum Kit"}
                      {!isTyping && !hasCustomKitName && (
                        <span className="text-white/40">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-3">
                  {[
                    { label: "Length", value: totalDurationLabel },
                    { label: "Slices", value: slices.length.toString().padStart(2, "0") },
                    { label: "Sample Rate", value: sampleRateLabel },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                      <p className="mt-1 text-lg font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Tags</p>
                    <div className="flex gap-2">
                      {(["drum", "loop"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setKitCategory(type)}
                          className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide transition ${
                            kitCategory === type
                              ? "bg-amber-300 text-black"
                              : "bg-white/10 text-white/70 hover:bg-white/20"
                          }`}
                        >
                          {type === "drum" ? "Drum Kit" : "Loop Kit"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {kitTags.map((tag) => (
                      <span
                        key={tag}
                        className="group inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                      >
                        {tag}
                        <button
                          type="button"
                          className="text-white/60 hover:text-white"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {kitTags.length < 3 && (
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onFocus={() => setIsTyping(true)}
                        onBlur={() => setIsTyping(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTag(tagInput)
                          }
                        }}
                        placeholder="Enter up to 3 tags"
                        className="min-w-[140px] flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-amber-200/15 bg-gradient-to-b from-[#0f0a15] to-[#050305] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs uppercase tracking-[0.35em] text-white/40">
                  <div className="flex items-center gap-2">
                    <span>Waveform View</span>
                    <span className="rounded-full border border-amber-200/50 px-2 py-1 text-[10px] font-semibold text-amber-100">UI v2</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full border border-white/10 text-white/80"
                      onClick={undoSlices}
                      disabled={!canUndo}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Undo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full border border-white/10 text-white/80"
                      onClick={redoSlices}
                      disabled={!canRedo}
                    >
                      <RotateCw className="mr-1 h-4 w-4" />
                      Redo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full border border-amber-200/40 bg-amber-200/10 text-amber-100"
                      onClick={() => clearSlices()}
                      disabled={!hasSlices}
                    >
                      <Trash className="mr-1 h-4 w-4" />
                      Clear Slices
                    </Button>
                    <span className="text-white/40 sm:ml-2">{`Zoom ${zoomLevel.toString().padStart(2, "0")}x`}</span>
                  </div>
                </div>
                <div className={`mt-4 h-[220px] overflow-visible rounded-[24px] border border-white/5 ${isModern ? "p-0" : "bg-black/40"}`}>
                  {audioBuffer &&
                    (isModern ? (
                      <CircularWaveform
                        audioBuffer={audioBuffer}
                        slices={slices}
                        potentialSlices={potentialSlices}
                        currentTime={currentPlaybackTime}
                        selectedSliceId={selectedSliceId}
                        onSliceClick={handleSliceClick}
                        onMarkerDrag={handleMarkerDrag}
                        onWaveformClick={handleWaveformClick}
                        onWaveformMouseUp={handleWaveformMouseUp}
                      />
                    ) : (
                      <Waveform
                        audioBuffer={audioBuffer}
                        slices={slices}
                        potentialSlices={potentialSlices}
                        currentTime={currentPlaybackTime}
                        zoomLevel={zoomLevel}
                        scrollPosition={scrollPosition}
                        onScrollChange={setScrollPosition}
                        onZoomChange={(newZoom) => setZoomLevel(newZoom)}
                        onSliceClick={handleSliceClick}
                        onMarkerDrag={handleMarkerDrag}
                        onWaveformClick={handleWaveformClick}
                        onWaveformMouseUp={handleWaveformMouseUp}
                        isCreatingSlice={isCreatingSlice}
                        newSliceStart={newSliceStart}
                      />
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                  <span>Drag to pan · Scroll to zoom · Double click to slice</span>
                  <span>ScrollPos {scrollPosition.toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-black/35 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full border border-white/15 text-white hover:border-amber-200/60"
                    onClick={() => {
                      const newZoom = Math.max(1, zoomLevel - 1)
                      setZoomLevel(newZoom)
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-full text-black ${isPlaying ? "bg-white/80" : "bg-gradient-to-r from-[#f5d97a] to-[#f0b942]"}`}
                    onClick={togglePlayback}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full border border-white/15 text-white hover:border-amber-200/60"
                    onClick={stopPlayback}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full border border-white/15 text-white hover:border-amber-200/60"
                    onClick={() => {
                      const newZoom = Math.min(50, zoomLevel + 1)
                      setZoomLevel(newZoom)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col text-right text-white/70">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">Playhead</p>
                  <p className="text-2xl font-mono text-white">{currentTimeLabel}</p>
                  <span className="text-xs text-white/60">of {totalDurationLabel}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-full border border-white/15 text-white/70 hover:text-white"
                    onClick={handleLoadNewAudio}
                  >
                    Load Audio
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-white/20 text-white/70 hover:text-white">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto bg-[#07050d] text-white">
                      <DropdownMenuLabel>Kit Settings</DropdownMenuLabel>
                      <DropdownMenuItem className="p-3 focus:bg-white/5">
                        <div className="space-y-3 w-full">
                          <div className="space-y-2">
                            <Label htmlFor="dropdown-kit-name">Kit Name</Label>
                            <Input
                              id="dropdown-kit-name"
                              value={kitName}
                              onChange={(e) => setKitName(e.target.value)}
                              placeholder="Untitled Drum Kit"
                              className="border-white/20 bg-black/30 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dropdown-prefix">Sample Prefix</Label>
                            <Input
                              id="dropdown-prefix"
                              value={kitPrefix}
                              onChange={(e) => setKitPrefix(e.target.value)}
                              className="border-white/20 bg-black/30 text-white"
                            />
                          </div>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Detection Engine</DropdownMenuLabel>
                      <DropdownMenuItem className="p-3 focus:bg-white/5">
                        <div className="space-y-4 w-full">
                          <div>
                            <div className="flex items-center justify-between text-xs text-white/60">
                              <span>Sensitivity</span>
                              <span>{sensitivity.toFixed(2)}</span>
                            </div>
                            <Slider value={[sensitivity]} min={0.01} max={0.5} step={0.01} onValueChange={(value) => setSensitivity(value[0])} />
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs text-white/60">
                              <span>Min Distance (s)</span>
                              <span>{minDistance.toFixed(2)}</span>
                            </div>
                            <Slider value={[minDistance]} min={0.01} max={0.5} step={0.01} onValueChange={(value) => setMinDistance(value[0])} />
                          </div>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Output & Session</DropdownMenuLabel>
                      <DropdownMenuItem className="p-3 focus:bg-white/5">
                        <div className="space-y-4 w-full">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              disabled
                              className="rounded-2xl border-white/10 bg-transparent text-white/40 cursor-not-allowed"
                            >
                              WAV (coming soon)
                            </Button>
                            <Button
                              variant={exportFormat === "mp3" ? "default" : "outline"}
                              className={`rounded-2xl ${exportFormat === "mp3" ? "bg-amber-300 text-black" : "border-white/20 text-white/80"}`}
                              onClick={() => setExportFormat("mp3")}
                            >
                              MP3
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="include-midi-dropdown" checked={includeMidi} onCheckedChange={(checked) => setIncludeMidi(!!checked)} />
                              <Label htmlFor="include-midi-dropdown" className="text-white/70">
                                Include MIDI map
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="include-metadata-dropdown"
                                checked={includeMetadata}
                                onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                              />
                              <Label htmlFor="include-metadata-dropdown" className="text-white/70">
                                Include metadata
                              </Label>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={() => detectSlices()}
                    disabled={isProcessing}
                    className="h-11 rounded-full bg-gradient-to-r from-[#f5d97a] via-[#f0b942] to-[#f0a53b] px-6 text-black hover:brightness-110"
                  >
                    Detect & Slice
                  </Button>
                  <Button
                    onClick={handleSaveProject}
                    disabled={isSavingProject || slices.length === 0}
                    variant="outline"
                    className="h-11 rounded-full border border-white/20 bg-transparent px-6 text-white/80 hover:text-white disabled:opacity-50"
                  >
                    {isSavingProject ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleSaveToLibrary}
                    disabled={isSavingKit || slices.length === 0}
                    variant="default"
                    className="h-11 rounded-full bg-gradient-to-r from-[#f5d97a] via-[#f0b942] to-[#f0a53b] px-6 text-black hover:brightness-110 disabled:opacity-50"
                  >
                    {isSavingKit ? "Saving..." : "Save to Library"}
                  </Button>
                  <Button
                    onClick={() => exportSlices()}
                    disabled={isProcessing || slices.length === 0}
                    variant="outline"
                    className="h-11 rounded-full border border-white/20 bg-transparent px-6 text-white/80 hover:text-white"
                  >
                    Export Selected
                  </Button>
                </div>
              </div>
            </section>

            <aside className="space-y-4" />
          </div>

          {/* Extracted slices section - only shown when slices exist */}
          {slices.length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl text-white">Detected Slices ({slices.length})</h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
                          <span>Size</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setGridLayout(1)}>
                          <div className={`flex items-center gap-2 ${gridLayout === 1 ? "font-bold" : ""}`}>
                            <div className="w-4 h-4 bg-primary/20 rounded-sm"></div>
                            Large View (1 per row)
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGridLayout(2)}>
                          <div className={`flex items-center gap-2 ${gridLayout === 2 ? "font-bold" : ""}`}>
                            <div className="flex gap-1">
                              <div className="w-2 h-4 bg-primary/20 rounded-sm"></div>
                              <div className="w-2 h-4 bg-primary/20 rounded-sm"></div>
                            </div>
                            Normal View (2 per row)
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGridLayout(3)}>
                          <div className={`flex items-center gap-2 ${gridLayout === 3 ? "font-bold" : ""}`}>
                            <div className="flex gap-1">
                              <div className="w-1.5 h-4 bg-primary/20 rounded-sm"></div>
                              <div className="w-1.5 h-4 bg-primary/20 rounded-sm"></div>
                              <div className="w-1.5 h-4 bg-primary/20 rounded-sm"></div>
                            </div>
                            Small View (3 per row)
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGridLayout(4)}>
                          <div className={`flex items-center gap-2 ${gridLayout === 4 ? "font-bold" : ""}`}>
                            <div className="flex gap-0.5">
                              <div className="w-1 h-4 bg-primary/20 rounded-sm"></div>
                              <div className="w-1 h-4 bg-primary/20 rounded-sm"></div>
                              <div className="w-1 h-4 bg-primary/20 rounded-sm"></div>
                              <div className="w-1 h-4 bg-primary/20 rounded-sm"></div>
                            </div>
                            Compact View (4 per row)
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-col gap-1 text-white/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.35em] text-white/40">Audition</span>
                      <Button
                        variant={auditionEnabled ? "default" : "outline"}
                        size="sm"
                        className={`h-7 rounded-full px-3 text-xs ${auditionEnabled ? "bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black" : ""}`}
                        onClick={() => setAuditionEnabled((prev) => !prev)}
                      >
                        {auditionEnabled ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {AUDITION_KEY_LAYOUT.map((row, rowIndex) => (
                        <div key={row.join("-")} className={cn("flex gap-1", rowIndex === 1 ? "pl-2" : "")}>
                          {row.map((key) => {
                            const padIndex = AUDITION_KEY_ORDER.indexOf(key)
                            const assignedSlice = slices[padIndex]
                            const isActive = activeAuditionKey === key
                            const isEnabled = auditionEnabled && Boolean(assignedSlice)
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={!isEnabled}
                                className={cn(
                                  "h-8 w-8 rounded-lg border text-[10px] font-mono uppercase tracking-[0.2em] transition focus:outline-none",
                                  isEnabled ? "text-white shadow-[0_4px_12px_rgba(0,0,0,0.45)]" : "cursor-not-allowed text-white/30 opacity-50",
                                  isActive
                                    ? "border-amber-300 bg-amber-300/20 shadow-[0_0_15px_rgba(245,217,122,0.8)]"
                                    : "border-white/15 bg-white/5 hover:border-white/30",
                                )}
                                title={assignedSlice ? `Play ${assignedSlice.name}` : "No slice assigned"}
                                onPointerDown={(event) => {
                                  event.preventDefault()
                                  if (!isEnabled) return
                                  triggerAuditionForKey(key)
                                }}
                                onPointerUp={() => {
                                  setActiveAuditionKey((current) => (current === key ? null : current))
                                }}
                                onPointerLeave={() => {
                                  setActiveAuditionKey((current) => (current === key ? null : current))
                                }}
                              >
                                {key.toUpperCase()}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => clearSlices()}>
                  Clear All
                </Button>
              </div>

              {/* Make the slices container scrollable with a fixed height */}
              <div className="max-h-[70vh] overflow-y-auto pr-0 sm:pr-2">
                <div
                  className={`grid grid-cols-1 ${
                    gridLayout === 1
                      ? "grid-cols-1"
                      : gridLayout === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : gridLayout === 3
                          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  } gap-4`}
                >
                  {slices.map((slice) => {
                    const sliceDuration = slice.end - slice.start
                    const sliceDurationLabel = `${sliceDuration.toFixed(2)}s`
                    const sliceStartLabel = formatTime(slice.start)
                    const sliceEndLabel = formatTime(slice.end)
                    const sliceWindowPercent = audioBuffer
                      ? Math.min(100, Math.max(4, (sliceDuration / audioBuffer.duration) * 100))
                      : 100
                    const isActiveSlice = selectedSliceId === slice.id

                    return (
                      <div
                        key={slice.id}
                        className={cn(
                          "rounded-[28px] border border-white/10 bg-gradient-to-br from-[#050407] via-[#090611] to-[#040307] text-white shadow-[0_18px_60px_rgba(3,3,7,0.55)] transition hover:border-white/20 focus-within:border-amber-200/60",
                          gridLayout === 1 ? "p-6" : gridLayout === 4 ? "p-3" : "p-4",
                          isActiveSlice && "border-amber-300/70 shadow-[0_0_25px_rgba(245,217,122,0.45)]",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <Input
                            value={slice.name}
                            onChange={(e) => updateSlice(slice.id, { name: e.target.value })}
                            className="flex-1 rounded-full border-white/15 bg-black/30 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-200/30"
                            size={12}
                          />

                          <select
                            value={slice.type}
                            onChange={(e) => updateSlice(slice.id, { type: e.target.value })}
                            className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70 focus:outline-none focus:ring-amber-200/30"
                          >
                            <option value="kick">Kick</option>
                            <option value="snare">Snare</option>
                            <option value="hat">Hat</option>
                            <option value="perc">Perc</option>
                            <option value="cymb">Cymbal</option>
                          </select>

                          <label className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
                            <Checkbox
                              checked={slice.selected}
                              onCheckedChange={(checked) => updateSlice(slice.id, { selected: !!checked })}
                              className="h-4 w-4 border-white/40 data-[state=checked]:border-amber-300 data-[state=checked]:bg-amber-300 data-[state=checked]:text-black"
                            />
                            Keep
                          </label>
                        </div>

                        <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#13111c] via-[#0c0b14] to-[#07050c] px-4 py-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-12 w-12 rounded-full border border-white/20 bg-gradient-to-r from-[#f5d97a] to-[#f0b942] text-black shadow-[0_8px_20px_rgba(245,217,122,0.45)] hover:brightness-110"
                              onClick={() => playSlice(slice.id)}
                            >
                              <Play className="h-5 w-5" />
                            </Button>

                            <div className="min-w-[150px] flex-1">
                              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Window</p>
                              <p className="font-mono text-lg text-white">{sliceDurationLabel}</p>
                              <p className="text-[11px] text-white/60">
                                {sliceStartLabel} – {sliceEndLabel}
                              </p>
                            </div>

                            <div className="min-w-[140px] flex-1">
                              <div className="h-1.5 w-full rounded-full bg-white/10">
                                <span
                                  className="block h-full rounded-full bg-gradient-to-r from-[#f5d97a] to-[#f0b942]"
                                  style={{ width: `${sliceWindowPercent}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-white/45">Clip coverage</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 ml-auto">
                              {(() => {
                                const fx = sliceFx[slice.id] || defaultFxSettings()
                                return (
                                  <SliceFxControls
                                    sliceId={slice.id}
                                    sliceType={slice.type}
                                    fx={fx}
                                    updateSliceFx={updateSliceFx}
                                    applyEqPreset={applyEqPreset}
                                    applyCompPreset={applyCompPreset}
                                    applyColorPreset={applyColorPreset}
                                  />
                                )
                              })()}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full border border-white/15 bg-white/5 text-white/80 hover:border-red-300/60 hover:text-red-200"
                                onClick={() => removeSlice(slice.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "mt-4 rounded-2xl border border-white/5 bg-black/30 p-3",
                            gridLayout === 1 ? "h-36" : gridLayout === 4 ? "h-20" : "h-28",
                          )}
                        >
                          {audioBuffer && (
                            <SliceWaveform
                              audioBuffer={audioBuffer}
                              start={slice.start}
                              end={slice.end}
                              fadeIn={slice.fadeIn}
                              fadeOut={slice.fadeOut}
                              fadeInShape={slice.fadeInShape || 0}
                              fadeOutShape={slice.fadeOutShape || 0}
                              type={slice.type}
                              zoomLevel={sliceZoomLevels[slice.id] || 1}
                              scrollPosition={sliceScrollPositions[slice.id] || 0.5}
                              onStartChange={(newStart) => updateSlice(slice.id, { start: newStart })}
                              onEndChange={(newEnd) => updateSlice(slice.id, { end: newEnd })}
                              onZoomChange={(newZoom) => handleSliceZoomChange(slice.id, newZoom)}
                              onScrollChange={(newScroll) => handleSliceScrollChange(slice.id, newScroll)}
                              onFadeInShapeChange={(newShape) => handleFadeInShapeChange(slice.id, newShape)}
                              onFadeOutShapeChange={(newShape) => handleFadeOutShapeChange(slice.id, newShape)}
                            />
                          )}

                          <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 rounded-full border border-white/15 text-white",
                                  (sliceScrollPositions[slice.id] || 0.5) <= 0.05
                                    ? "cursor-not-allowed opacity-30"
                                    : "bg-white/5 hover:border-amber-200/60",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const currentPosition = sliceScrollPositions[slice.id] || 0.5
                                  if (currentPosition > 0.05) {
                                    handleSliceScrollChange(slice.id, Math.max(0, currentPosition - 0.1))
                                  }
                                }}
                                disabled={(sliceScrollPositions[slice.id] || 0.5) <= 0.05}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 rounded-full border border-white/15 text-white",
                                  (sliceScrollPositions[slice.id] || 0.5) >= 0.95
                                    ? "cursor-not-allowed opacity-30"
                                    : "bg-white/5 hover:border-amber-200/60",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const currentPosition = sliceScrollPositions[slice.id] || 0.5
                                  if (currentPosition < 0.95) {
                                    handleSliceScrollChange(slice.id, Math.min(1, currentPosition + 0.1))
                                  }
                                }}
                                disabled={(sliceScrollPositions[slice.id] || 0.5) >= 0.95}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>

                            <span className="font-mono text-xs text-white/70">{(sliceDuration * 1000).toFixed(0)}ms</span>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full border border-white/15 bg-white/5 text-white hover:border-amber-200/60"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSliceZoomChange(slice.id, Math.max(1, (sliceZoomLevels[slice.id] || 1) - 0.5))
                                }}
                              >
                                <ZoomOut className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full border border-white/15 bg-white/5 text-white hover:border-amber-200/60"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSliceZoomChange(slice.id, Math.min(20, (sliceZoomLevels[slice.id] || 1) + 0.5))
                                }}
                              >
                                <ZoomIn className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between px-1 text-white/70">
                          <div className="flex flex-col items-center">
                            <Knob
                              value={slice.fadeIn}
                              min={0}
                              max={100}
                              step={1}
                              size={18}
                              onChange={(value) => updateSlice(slice.id, { fadeIn: value })}
                              activeColor="#3b82f6"
                            />
                            <span className="mt-1 text-[10px]">{slice.fadeIn}ms</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <Knob
                              value={Math.round((slice.start - (audioBuffer ? 0 : 0)) * 100)}
                              min={0}
                              max={100}
                              step={1}
                              size={18}
                              onChange={(value) => {
                                const newStart = value / 100 + (audioBuffer ? 0 : 0)
                                if (newStart < slice.end - 0.01) {
                                  updateSlice(slice.id, { start: newStart })
                                }
                              }}
                              activeColor="#3b82f6"
                            />
                            <span className="mt-1 text-[10px]">Start</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <Knob
                              value={Math.round((slice.end - (audioBuffer ? 0 : 0)) * 100)}
                              min={0}
                              max={audioBuffer ? Math.round(audioBuffer.duration * 100) : 100}
                              step={1}
                              size={18}
                              onChange={(value) => {
                                const newEnd = value / 100 + (audioBuffer ? 0 : 0)
                                if (newEnd > slice.start + 0.01) {
                                  updateSlice(slice.id, { end: newEnd })
                                }
                              }}
                              activeColor="#ef4444"
                            />
                            <span className="mt-1 text-[10px]">End</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <Knob
                              value={slice.fadeOut}
                              min={0}
                              max={500}
                              step={5}
                              size={18}
                              onChange={(value) => updateSlice(slice.id, { fadeOut: value })}
                              activeColor="#ef4444"
                            />
                            <span className="mt-1 text-[10px]">{slice.fadeOut}ms</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
