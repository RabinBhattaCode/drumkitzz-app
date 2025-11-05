"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Upload,
  Mic,
  Play,
  Pause,
  Square,
  Minus,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Trash,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { YouTubeExtractor } from "./components/youtube-extractor"
import { SliceWaveform } from "./components/slice-waveform"
import { Waveform } from "./components/waveform"
import { Knob } from "./components/knob"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { extractDrumsWithLalalAI, type ExtractionProgress } from "@/lib/audio-extraction"
import { ExtractionProgressDialog } from "./components/extraction-progress-dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

// Define OfflineContext type
type OfflineContext = OfflineAudioContext

export default function DrumSlicerPro() {
  // Auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

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
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)
  const [audioContextInitialized, setAudioContextInitialized] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [useOriginalAudio, setUseOriginalAudio] = useState(false)
  const [autoExtractDrums, setAutoExtractDrums] = useState(true)

  // Slicing state
  const [slices, setSlices] = useState<
    Array<{
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
    }>
  >([])
  const [potentialSlices, setPotentialSlices] = useState<Array<number>>([])
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null)
  const [isCreatingSlice, setIsCreatingSlice] = useState(false)
  const [newSliceStart, setNewSliceStart] = useState<number | null>(null)

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

  // Export settings
  const [exportFormat, setExportFormat] = useState<"wav" | "mp3">("wav")
  const [includeMidi, setIncludeMidi] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)

  // Zoom and navigation
  const [zoomLevel, setZoomLevel] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isZoomingIn, setIsZoomingIn] = useState(false)
  const [isZoomingOut, setIsZoomingOut] = useState(false)
  // Grid layout for slices
  const [gridLayout, setGridLayout] = useState<1 | 2 | 3 | 4>(2) // Default to 2 slices per row (normal view)

  // Audio context
  const audioContext = useRef<AudioContext | null>(null)
  const sourceNode = useRef<AudioBufferSourceNode | null>(null)
  const gainNode = useRef<GainNode | null>(null)
  const playbackStartTime = useRef<number>(0)
  const pausedTime = useRef<number>(0)
  const animationFrameId = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const offlineAudioContextRef = useRef<OfflineContext | null>(null)
  const { toast } = useToast()

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

  // Initialize audio context with user interaction
  const initializeAudioContext = async () => {
    if (!audioContextInitialized) {
      try {
        // Create audio context
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Resume audio context (needed for iOS)
        if (audioContext.current.state === "suspended") {
          await audioContext.current.resume()
        }

        // Create gain node
        gainNode.current = audioContext.current.createGain()
        gainNode.current.connect(audioContext.current.destination)

        // Set initial volume
        if (gainNode.current) {
          gainNode.current.gain.value = volume
        }

        setAudioContextInitialized(true)

        // Show success toast
        toast({
          title: "Audio initialized",
          description: "Audio playback is now enabled",
        })
      } catch (error) {
        console.error("Failed to initialize audio context:", error)
        toast({
          title: "Audio Error",
          description: "Failed to initialize audio. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

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
      const transients = findPotentialTransients(audioData, sampleRate, sensitivity, minDistance)
      setPotentialSlices(transients)
    }, 300)

    return () => clearTimeout(handler)
  }, [audioBuffer, sensitivity, minDistance])

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
      setSlices([])
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
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
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

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Initialize audio context if not already done
    if (!audioContextInitialized) {
      initializeAudioContext()
    }

    setAudioFile(file)
    setSlices([])
    setPotentialSlices([])
    setSelectedSliceId(null)

    try {
      setIsProcessing(true)
      const arrayBuffer = await file.arrayBuffer()

      if (!audioContext.current) {
        throw new Error("Audio context not initialized")
      }

      const decodedBuffer = await audioContext.current.decodeAudioData(arrayBuffer)

      // Store the original audio buffer
      setOriginalAudioBuffer(decodedBuffer)

      // Always set the audio buffer immediately so UI can show it
      setAudioBuffer(decodedBuffer)
      setIsProcessing(false)

      toast({
        title: "File loaded",
        description: `${file.name} loaded successfully`,
      })

      // If auto-extract is enabled, start extraction in the background
      if (autoExtractDrums) {
        toast({
          title: "Starting drum extraction",
          description: "This may take 1-3 minutes...",
        })
        extractDrumStem(file)
      }
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

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.includes("audio")) {
        // Initialize audio context if not already done
        if (!audioContextInitialized) {
          initializeAudioContext()
        }

        setAudioFile(file)
        setSlices([])
        setPotentialSlices([])
        setSelectedSliceId(null)

        try {
          setIsProcessing(true)
          const arrayBuffer = await file.arrayBuffer()

          if (!audioContext.current) {
            throw new Error("Audio context not initialized")
          }

          const decodedBuffer = await audioContext.current.decodeAudioData(arrayBuffer)

          // Store the original audio buffer
          setOriginalAudioBuffer(decodedBuffer)

          // Always set the audio buffer immediately so UI can show it
          setAudioBuffer(decodedBuffer)
          setIsProcessing(false)

          toast({
            title: "File loaded",
            description: `${file.name} loaded successfully`,
          })

          // If auto-extract is enabled, extract drum stem in the background
          if (autoExtractDrums) {
            toast({
              title: "Starting drum extraction",
              description: "This may take 1-3 minutes...",
            })
            extractDrumStem(file)
          }
        } catch (error) {
          console.error("Error decoding audio data:", error)
          setIsProcessing(false)
          toast({
            title: "Error loading file",
            description: "Failed to decode audio file. Please try a different file.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file",
          variant: "destructive",
        })
      }
    }
  }

  // Extract drum stem from audio file using external API
  const extractDrumStem = async (audioFile: File) => {
    if (!audioContext.current) return

    try {
      setIsStemExtracting(1)
      setShowExtractionDialog(true)

      // Always use the extraction function which calls the secure API route
      const result = await extractDrumsWithLalalAI(audioFile, audioContext.current, (progress: ExtractionProgress) => {
        setExtractionProgress(progress)
      })

      if (result.success && result.audioBuffer) {
        // Set the extracted drum buffer as the current audio buffer
        if (!useOriginalAudio) {
          setAudioBuffer(result.audioBuffer)
        }

        toast({
          title: "Drum extraction complete",
          description: "Drum stem extracted successfully",
        })

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
      initializeAudioContext()
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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

          const decodedBuffer = await audioContext.current.decodeAudioData(arrayBuffer)

          // Store the original audio buffer
          setOriginalAudioBuffer(decodedBuffer)

          // Always set the audio buffer immediately
          setAudioBuffer(decodedBuffer)
          const file = new File([blob], "recording.webm", { type: "audio/webm" })
          setAudioFile(file)
          setSlices([])
          setPotentialSlices([])
          setSelectedSliceId(null)

          toast({
            title: "Recording complete",
            description: `${recordingTime}s recording saved`,
          })

          // If auto-extract is enabled, extract drum stem in the background
          if (autoExtractDrums) {
            toast({
              title: "Starting drum extraction",
              description: "This may take 1-3 minutes...",
            })
            extractDrumStem(file)
          }
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
        if (recordingInterval) {
          clearInterval(recordingInterval)
          setRecordingInterval(null)
        }
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)

      // Set up timer for recording duration
      const interval = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          // Auto-stop after 60 seconds
          if (newTime >= 60) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)

      setRecordingInterval(interval)

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
  const detectSlices = async () => {
    if (!audioBuffer) return

    // Ensure audio context is initialized
    if (!audioContextInitialized) {
      initializeAudioContext()
    }

    setIsProcessing(true)

    try {
      // Get audio data from the buffer
      const audioData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate

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

      setSlices(newSlices)
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
      toast({
        title: "Processing error",
        description: "An error occurred while processing the audio.",
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
  const togglePlayback = () => {
    // Ensure audio context is initialized
    if (!audioContextInitialized) {
      initializeAudioContext()
    }

    if (isPlaying) {
      pausePlayback()
    } else {
      if (isPaused) {
        resumePlayback()
      } else {
        startPlayback()
      }
    }
  }

  // Start audio playback
  const startPlayback = (startTime = 0) => {
    if (!audioBuffer || !audioContext.current) {
      toast({
        title: "Playback error",
        description: "Audio not loaded or audio context not initialized",
        variant: "destructive",
      })
      return
    }

    // Resume audio context if suspended (needed for iOS)
    if (audioContext.current.state === "suspended") {
      audioContext.current.resume()
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
  const resumePlayback = () => {
    startPlayback(pausedTime.current)
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
    // Ensure audio context is initialized
    if (!audioContextInitialized) {
      await initializeAudioContext()
    }

    const slice = slices.find((s) => s.id === sliceId)
    if (!slice || !audioBuffer || !audioContext.current) return

    // Set this slice as selected first for immediate visual feedback
    setSelectedSliceId(sliceId)

    // Resume audio context if suspended (needed for iOS)
    if (audioContext.current.state === "suspended") {
      await audioContext.current.resume()
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
    sliceGainNode.gain.value = isMuted ? 0 : volume

    // Connect nodes to prepare for playback
    sourceNode.current.connect(sliceGainNode)
    sliceGainNode.connect(audioContext.current.destination)

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

      // Set the buffer and start playback
      if (sourceNode.current) {
        sourceNode.current.buffer = sliceBuffer
        sourceNode.current.start(0)
      }
    }

    // Process audio data immediately
    processAudioData()

    // Show toast notification after playback has started
    setTimeout(() => {
      toast({
        title: `Playing ${slice.type}`,
        description: `${slice.name} (${((slice.end - slice.start) * 1000).toFixed(0)}ms)`,
        duration: 1500,
      })
    }, 0)

    // Set timeout to update state when playback ends
    setTimeout(
      () => {
        sourceNode.current = null
      },
      (slice.end - slice.start) * 1000,
    )
  }

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

  const generateMidiFile = (slices: typeof slices): Blob => {
    // Simplified MIDI generation
    return new Blob(["MIDI data placeholder"], { type: "audio/midi" })
  }

  const generateMetadataFile = (slices: typeof slices): string => {
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
  const exportSlices = async () => {
    if (!audioBuffer || slices.length === 0) return

    const selectedSlices = slices.filter((slice) => slice.selected)
    if (selectedSlices.length === 0) {
      toast({
        title: "Export error",
        description: "No slices selected for export",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create a zip file with all samples
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()

      // Group slices by type
      const slicesByType: Record<string, typeof slices> = {}
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
      toast({
        title: "Export complete",
        description: `${selectedSlices.length} slices exported successfully`,
      })
    } catch (error) {
      console.error("Error exporting slices:", error)
      setIsProcessing(false)
      toast({
        title: "Export error",
        description: "An error occurred while exporting slices.",
        variant: "destructive",
      })
    }
  }

  const generateTypeMetadataFile = (type: string, slices: typeof slices): string => {
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
    setSlices([...slices, newSlice])
    return true
  }

  // Update slice properties
  const updateSlice = (sliceId: string, updates: Partial<(typeof slices)[0]>) => {
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
      setSlices(updatedSlices)
    } else {
      // For non-type updates, just update the slice directly
      setSlices(slices.map((slice) => (slice.id === sliceId ? { ...slice, ...updates } : slice)))
    }
  }

  // Generate a name for a slice based on type and existing slices
  const generateSliceName = (
    prefix: string,
    type: string,
    allSlices: typeof slices,
    currentSliceId?: string,
  ): string => {
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
  const renumberSlicesByType = (slices: typeof slices): void => {
    // Group slices by type
    const slicesByType: Record<string, typeof slices> = {}

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
    setSlices(updatedSlices)

    // If this was the selected slice, clear selection
    if (selectedSliceId === sliceId) {
      setSelectedSliceId(null)
    }
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

  // Render the landing page or the full application based on whether an audio file is loaded
  return (
    <main className="flex flex-col items-center justify-center p-2 md:p-8 max-w-full overflow-x-hidden">
      {/* Extraction Progress Dialog */}
      <ExtractionProgressDialog
        isOpen={showExtractionDialog}
        progress={extractionProgress}
        onClose={() => setShowExtractionDialog(false)}
      />

      {!audioBuffer ? (
        // Landing page with file upload
        <div className="flex flex-col items-center justify-center w-full px-4 md:px-0 md:max-w-3xl text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-6">Welcome to DrumKitzz</h1>
          <p className="text-base md:text-xl mb-6 md:mb-12">Create, process, and share drum samples</p>

          <div className="w-full max-w-md">
            <div className="flex flex-col items-center space-y-6">
              <Button
                variant="outline"
                className="w-full md:w-64 h-20 md:h-24 border-dashed bg-transparent"
                asChild
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={initializeAudioContext}
              >
                <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <Upload className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Select audio file or drag & drop</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>

              <div className="flex items-center space-x-2 text-sm">
                <Checkbox
                  id="auto-extract"
                  checked={autoExtractDrums}
                  onCheckedChange={(checked) => setAutoExtractDrums(!!checked)}
                />
                <Label htmlFor="auto-extract">Auto-extract drum stem</Label>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">or</p>
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="animate-pulse text-red-500">●</span>
                      <span>Recording: {recordingTime}s / 60s</span>
                    </div>
                    <Button onClick={stopRecording} variant="destructive">
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center w-full">
                    <Button onClick={startRecording} className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Record Audio (5-60s)
                    </Button>
                  </div>
                )}

                <p className="text-sm text-muted-foreground my-2">or</p>

                <div className="mt-2 w-full max-w-full">
                  <YouTubeExtractor
                    onAudioExtracted={(blob, title) => {
                      // Create a File object from the blob
                      const file = new File([blob], `${title}.mp3`, { type: "audio/mpeg" })

                      // Initialize audio context if not already done
                      if (!audioContextInitialized) {
                        initializeAudioContext()
                      }

                      // Process the file as if it was uploaded
                      setAudioFile(file)
                      setSlices([])
                      setPotentialSlices([])
                      setSelectedSliceId(null)

                      // Process the audio file
                      ;(async () => {
                        try {
                          setIsProcessing(true)

                          if (!audioContext.current) {
                            throw new Error("Audio context not initialized")
                          }

                          // Create a sample audio buffer instead of trying to decode the blob
                          // This avoids the decodeAudioData error
                          const sampleBuffer = createSampleAudioBuffer(audioContext.current)

                          // Store the original audio buffer
                          setOriginalAudioBuffer(sampleBuffer)

                          // Always set the audio buffer immediately so UI can show it
                          setAudioBuffer(sampleBuffer)
                          setIsProcessing(false)

                          toast({
                            title: "YouTube audio loaded",
                            description: `${title} loaded successfully`,
                          })

                          // If auto-extract is enabled, extract drum stem in the background
                          if (autoExtractDrums) {
                            toast({
                              title: "Starting drum extraction",
                              description: "This may take 1-3 minutes...",
                            })
                            extractDrumStem(file)
                          }
                        } catch (error) {
                          console.error("Error processing audio data:", error)
                          setIsProcessing(false)
                          toast({
                            title: "Error loading audio",
                            description: "Failed to process audio from YouTube. Using a sample drum pattern instead.",
                            variant: "destructive",
                          })

                          // Create a fallback audio buffer
                          if (audioContext.current) {
                            const fallbackBuffer = createSampleAudioBuffer(audioContext.current)
                            setOriginalAudioBuffer(fallbackBuffer)
                            setAudioBuffer(fallbackBuffer)
                          }
                        }
                      })()
                    }}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Full application with audio loaded - using the new compact layout
        <div className="container mx-auto py-2 md:py-4 w-full">
          {/* Kit name heading - replace the existing h2 with this interactive version */}
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 w-full px-2 sm:px-0">
            {isEditingKitName ? (
              <input
                type="text"
                value={kitName}
                onChange={handleKitNameChange}
                onBlur={handleKitNameBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingKitName(false)
                    setIsTyping(false)
                  }
                }}
                className="text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-primary outline-none w-full"
                autoFocus
                placeholder="Untitled Drum Kit"
              />
            ) : (
              <h2
                className="text-xl sm:text-2xl font-bold cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                onClick={() => setIsEditingKitName(true)}
              >
                {kitName || "Untitled Drum Kit"}
                {!isTyping && !hasCustomKitName && (
                  <span className="text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="sm:w-[18px] sm:h-[18px]"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </span>
                )}
              </h2>
            )}
          </div>

          {/* Waveform */}
          <div className="h-[120px] sm:h-[160px] bg-muted rounded-md overflow-hidden mb-4">
            {audioBuffer && (
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
            )}
          </div>

          {/* Controls bar - reorganized without kit name input */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 mb-6">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
              {/* Playback controls */}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 bg-transparent"
                onClick={() => {
                  const newZoom = Math.max(1, zoomLevel - 1)
                  setZoomLevel(newZoom)
                }}
                onMouseDown={() => setIsZoomingOut(true)}
                onMouseUp={() => setIsZoomingOut(false)}
                onMouseLeave={() => setIsZoomingOut(false)}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="icon"
                className="rounded-full h-12 w-12 sm:h-10 sm:w-10"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 sm:h-4 sm:w-4" />
                ) : (
                  <Play className="h-5 w-5 sm:h-4 sm:w-4 ml-0.5" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 bg-transparent"
                onClick={stopPlayback}
              >
                <Square className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 bg-transparent"
                onClick={() => {
                  const newZoom = Math.min(50, zoomLevel + 1)
                  setZoomLevel(newZoom)
                }}
                onMouseDown={() => setIsZoomingIn(true)}
                onMouseUp={() => setIsZoomingIn(false)}
                onMouseLeave={() => setIsZoomingIn(false)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 hidden sm:block"></div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <Button onClick={detectSlices} disabled={isProcessing} className="h-10">
                Detect & Slice
              </Button>

              <Button
                onClick={exportSlices}
                disabled={isProcessing || slices.length === 0}
                variant="outline"
                className="h-10 bg-transparent"
              >
                Export Selected
              </Button>

              {/* Settings dropdown with scrollable content */}
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] overflow-y-auto">
                    <DropdownMenuLabel>Kit Settings</DropdownMenuLabel>
                    <DropdownMenuItem className="p-2 h-auto focus:bg-transparent">
                      <div className="w-full space-y-2">
                        <div className="space-y-2">
                          <Label htmlFor="kit-name">Kit Name</Label>
                          <Input
                            id="kit-name"
                            value={kitName}
                            onChange={(e) => setKitName(e.target.value)}
                            placeholder="Untitled Drum Kit"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sample-prefix">Sample Prefix</Label>
                          <Input id="sample-prefix" value={kitPrefix} onChange={(e) => setKitPrefix(e.target.value)} />
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Detection Settings</DropdownMenuLabel>
                    <DropdownMenuItem className="p-2 h-auto focus:bg-transparent">
                      <div className="w-full space-y-4">
                        <div className="space-y-2">
                          <Label>Sensitivity: {sensitivity.toFixed(2)}</Label>
                          <Slider
                            value={[sensitivity]}
                            min={0.01}
                            max={0.5}
                            step={0.01}
                            onValueChange={(value) => setSensitivity(value[0])}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Min Distance: {minDistance.toFixed(2)}s</Label>
                          <Slider
                            value={[minDistance]}
                            min={0.01}
                            max={0.5}
                            step={0.01}
                            onValueChange={(value) => setMinDistance(value[0])}
                          />
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Export Settings</DropdownMenuLabel>
                    <DropdownMenuItem className="p-2 h-auto focus:bg-transparent">
                      <div className="w-full space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={exportFormat === "wav" ? "default" : "outline"}
                            onClick={() => setExportFormat("wav")}
                            size="sm"
                          >
                            WAV
                          </Button>
                          <Button
                            variant={exportFormat === "mp3" ? "default" : "outline"}
                            onClick={() => setExportFormat("mp3")}
                            size="sm"
                          >
                            MP3
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-midi"
                            checked={includeMidi}
                            onCheckedChange={(checked) => setIncludeMidi(!!checked)}
                          />
                          <Label htmlFor="include-midi">Include MIDI</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-metadata"
                            checked={includeMetadata}
                            onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                          />
                          <Label htmlFor="include-metadata">Include Metadata</Label>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setAudioBuffer(null)
                  setAudioFile(null)
                  setOriginalAudioBuffer(null)
                  setSlices([])
                  setPotentialSlices([])
                }}
              >
                Load Different Audio
              </Button>
            </div>
          </div>

          {/* Extracted slices section - only shown when slices exist */}
          {slices.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Detected Slices ({slices.length})</h2>
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
                <Button variant="outline" size="sm" onClick={() => setSlices([])}>
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
                  } gap-3`}
                >
                  {slices.map((slice) => (
                    <div
                      key={slice.id}
                      className={`bg-white p-3 rounded-md border ${
                        gridLayout === 1 ? "p-4" : gridLayout === 4 ? "p-2" : "p-3"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={slice.name}
                          onChange={(e) => updateSlice(slice.id, { name: e.target.value })}
                          className="flex-1 mr-2 text-sm h-9"
                          size={12}
                        />

                        <select
                          value={slice.type}
                          onChange={(e) => updateSlice(slice.id, { type: e.target.value })}
                          className="border rounded-md p-1 text-sm h-9"
                        >
                          <option value="kick">Kick</option>
                          <option value="snare">Snare</option>
                          <option value="hat">Hat</option>
                          <option value="perc">Perc</option>
                          <option value="cymb">Cymb</option>
                        </select>

                        <Checkbox
                          checked={slice.selected}
                          onCheckedChange={(checked) => updateSlice(slice.id, { selected: !!checked })}
                          className="h-5 w-5 mx-1"
                        />

                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-9 w-9" onClick={() => playSlice(slice.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 h-9 w-9"
                            onClick={() => removeSlice(slice.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div
                        className={`${
                          gridLayout === 1 ? "h-32" : gridLayout === 4 ? "h-16" : "h-20"
                        } bg-muted rounded-md mb-2 relative`}
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

                        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-5 w-5 ${
                                (sliceScrollPositions[slice.id] || 0.5) <= 0.05
                                  ? "bg-black/10 cursor-not-allowed opacity-50"
                                  : "bg-black/20 hover:bg-black/40"
                              } rounded-full p-0`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const currentPosition = sliceScrollPositions[slice.id] || 0.5
                                if (currentPosition > 0.05) {
                                  handleSliceScrollChange(slice.id, Math.max(0, currentPosition - 0.1))
                                }
                              }}
                              disabled={(sliceScrollPositions[slice.id] || 0.5) <= 0.05}
                            >
                              <ChevronLeft className="h-3 w-3 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-5 w-5 ${
                                (sliceScrollPositions[slice.id] || 0.5) >= 0.95
                                  ? "bg-black/10 cursor-not-allowed opacity-50"
                                  : "bg-black/20 hover:bg-black/40"
                              } rounded-full p-0`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const currentPosition = sliceScrollPositions[slice.id] || 0.5
                                if (currentPosition < 0.95) {
                                  handleSliceScrollChange(slice.id, Math.min(1, currentPosition + 0.1))
                                }
                              }}
                              disabled={(sliceScrollPositions[slice.id] || 0.5) >= 0.95}
                            >
                              <ChevronRight className="h-3 w-3 text-white" />
                            </Button>
                          </div>

                          <span>{((slice.end - slice.start) * 1000).toFixed(0)}ms</span>

                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 bg-black/20 hover:bg-black/40 rounded-full p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSliceZoomChange(slice.id, Math.max(1, (sliceZoomLevels[slice.id] || 1) - 0.5))
                              }}
                            >
                              <ZoomOut className="h-3 w-3 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 bg-black/20 hover:bg-black/40 rounded-full p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSliceZoomChange(slice.id, Math.min(20, (sliceZoomLevels[slice.id] || 1) + 0.5))
                              }}
                            >
                              <ZoomIn className="h-3 w-3 text-white" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1 mt-1">
                        {/* All knobs in a single row with labels underneath - reordered */}
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
                          <span className="text-[10px] mt-1">{slice.fadeIn}ms</span>
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
                          <span className="text-[10px] mt-1">Start</span>
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
                          <span className="text-[10px] mt-1">End</span>
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
                          <span className="text-[10px] mt-1">{slice.fadeOut}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
