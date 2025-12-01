/**
 * Audio Extraction Utilities
 * Handles drum stem extraction using Demucs AI via Replicate or local installation
 */

export interface ExtractionProgress {
  stage: "uploading" | "processing" | "downloading" | "complete" | "error"
  progress: number
  message: string
}

export interface ExtractionResult {
  success: boolean
  audioBuffer?: AudioBuffer
  error?: string
}

const LALAL_ALLOWED_STEMS = [
  "drum",
  "bass",
  "vocals",
  "voice",
  "piano",
  "electric_guitar",
  "acoustic_guitar",
  "synthesizer",
  "strings",
  "wind",
] as const

type LalalStem = (typeof LALAL_ALLOWED_STEMS)[number]

function normalizeStem(stem: LalalStem) {
  if (stem === "voice" || stem === "vocals") return "vocals"
  if (stem === "drum") return "drums"
  return stem
}

type ExtractOptions = {
  userId?: string
  projectId?: string
  kitId?: string
}

/**
 * Extract drums from audio using Demucs AI via Replicate API (or Lalal backend)
 */
export async function extractDrumsWithReplicate(
  audioFile: File,
  audioContext: AudioContext,
  stemOrProgress?: LalalStem | ((progress: ExtractionProgress) => void),
  onProgressOrOptions?: ((progress: ExtractionProgress) => void) | ExtractOptions,
  maybeOptions?: ExtractOptions,
): Promise<ExtractionResult> {
  // Backward-compatible args parsing
  const stem: LalalStem =
    typeof stemOrProgress === "string" && LALAL_ALLOWED_STEMS.includes(stemOrProgress as LalalStem)
      ? (stemOrProgress as LalalStem)
      : "drum"
  const onProgress =
    typeof stemOrProgress === "function"
      ? stemOrProgress
      : typeof onProgressOrOptions === "function"
        ? onProgressOrOptions
        : undefined
  const options: ExtractOptions =
    (typeof onProgressOrOptions === "object" && onProgressOrOptions !== null
      ? onProgressOrOptions
      : typeof maybeOptions === "object" && maybeOptions !== null
        ? maybeOptions
        : {}) ?? {}

  try {
    // Step 1: Upload audio file
    onProgress?.({
      stage: "uploading",
      progress: 10,
      message: "Uploading audio to AI service...",
    })

    const uploadFormData = new FormData()
    uploadFormData.append("audio", audioFile)
    uploadFormData.append("action", "upload")
    uploadFormData.append("stem", stem)
    if (options.userId) uploadFormData.append("userId", options.userId)
    if (options.projectId) uploadFormData.append("projectId", options.projectId)
    if (options.kitId) uploadFormData.append("kitId", options.kitId)

    const uploadResponse = await fetch("/api/extract-drums", {
      method: "POST",
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload audio for extraction")
    }

    const uploadData = await uploadResponse.json()

    if (!uploadData.success) {
      throw new Error(uploadData.error || "Upload failed")
    }

    // Step 2: Poll for completion
    onProgress?.({
      stage: "processing",
      progress: 30,
      message: `AI is separating ${normalizeStem(stem)} stem (30-60 seconds)...`,
    })

    const predictionId = uploadData.predictionId
    let attempts = 0
    const maxAttempts = 120 // 2 minutes max (check every second)
    let stemUrl: string | null = null

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second

      const checkFormData = new FormData()
      checkFormData.append("action", "check")
      checkFormData.append("predictionId", predictionId)
      // preserve the requested stem so the API can normalize its payload shape
      checkFormData.append("stem", stem)

      const checkResponse = await fetch("/api/extract-drums", {
        method: "POST",
        body: checkFormData,
      })

      if (!checkResponse.ok) {
        throw new Error("Failed to check extraction status")
      }

      const checkData = await checkResponse.json()
      const maybeStemUrl =
        checkData.output?.supabaseUploads?.[0]?.signedUrl ||
        checkData.output?.stemUrl ||
        checkData.output?.[normalizeStem(stem)] ||
        checkData.output?.drums

      if (checkData.status === "succeeded" && maybeStemUrl) {
        stemUrl = maybeStemUrl
        break
      }

      if (checkData.status === "failed") {
        throw new Error(checkData.error || "AI extraction failed")
      }

      // Update progress (30% to 85% during processing)
      const progressPercent = 30 + Math.min(55, (attempts / maxAttempts) * 55)
      onProgress?.({
        stage: "processing",
        progress: progressPercent,
        message: `AI processing... (${attempts}s elapsed)`,
      })

      attempts++
    }

    if (!stemUrl) {
      throw new Error("Extraction timed out after 2 minutes")
    }

    // Step 3: Download the extracted drum stem
    onProgress?.({
      stage: "downloading",
      progress: 90,
      message: "Downloading stem...",
    })

    // Use server proxy to avoid CORS/blocking from third-party URLs
    const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(stemUrl)}`
    const drumsResponse = await fetch(proxyUrl)
    if (!drumsResponse.ok) {
      let bodyText = ""
      try {
        bodyText = await drumsResponse.text()
      } catch {
        // ignore
      }
      throw new Error(
        `Failed to download stem (proxy status ${drumsResponse.status})${bodyText ? ` - ${bodyText.slice(0, 200)}` : ""}`,
      )
    }

    const drumsArrayBuffer = await drumsResponse.arrayBuffer()
    if (!drumsArrayBuffer || drumsArrayBuffer.byteLength === 0) {
      throw new Error("Downloaded stem was empty")
    }

    // Step 4: Decode audio
    onProgress?.({
      stage: "downloading",
      progress: 95,
      message: "Decoding audio...",
    })

    let drumsBuffer: AudioBuffer
    try {
      drumsBuffer = await audioContext.decodeAudioData(drumsArrayBuffer)
    } catch (decodeError) {
      throw new Error("Could not decode extracted stem audio")
    }

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Stem extraction complete!",
    })

    return {
      success: true,
      audioBuffer: drumsBuffer,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    onProgress?.({
      stage: "error",
      progress: 0,
      message: errorMessage,
    })

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Extract drums using local Demucs installation (100% free)
 * Requires Python and Demucs to be installed locally
 */
export async function extractDrumsWithLocalDemucs(
  audioFile: File,
  audioContext: AudioContext,
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<ExtractionResult> {
  try {
    // Step 1: Upload audio file to server
    onProgress?.({
      stage: "uploading",
      progress: 10,
      message: "Uploading audio for local processing...",
    })

    const uploadFormData = new FormData()
    uploadFormData.append("audio", audioFile)
    uploadFormData.append("action", "local-extract")

    const uploadResponse = await fetch("/api/extract-drums", {
      method: "POST",
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload audio for local extraction")
    }

    const uploadData = await uploadResponse.json()

    if (!uploadData.success) {
      throw new Error(uploadData.error || "Local extraction setup failed")
    }

    // Step 2: Poll for completion (local processing is faster)
    onProgress?.({
      stage: "processing",
      progress: 30,
      message: "Processing with local Demucs (10-30 seconds)...",
    })

    const taskId = uploadData.taskId
    let attempts = 0
    const maxAttempts = 60 // 1 minute max
    let drumStemUrl: string | null = null

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const checkFormData = new FormData()
      checkFormData.append("action", "check")
      checkFormData.append("taskId", taskId)

      const checkResponse = await fetch("/api/extract-drums", {
        method: "POST",
        body: checkFormData,
      })

      if (!checkResponse.ok) {
        throw new Error("Failed to check local extraction status")
      }

      const checkData = await checkResponse.json()

      if (checkData.status === "complete" && checkData.drumStemUrl) {
        drumStemUrl = checkData.drumStemUrl
        break
      }

      if (checkData.status === "error") {
        throw new Error(checkData.error || "Local extraction failed")
      }

      // Update progress
      const progressPercent = 30 + Math.min(55, (attempts / maxAttempts) * 55)
      onProgress?.({
        stage: "processing",
        progress: progressPercent,
        message: `Local processing... (${attempts}s elapsed)`,
      })

      attempts++
    }

    if (!drumStemUrl) {
      throw new Error("Local extraction timed out")
    }

    // Step 3: Download the result
    onProgress?.({
      stage: "downloading",
      progress: 90,
      message: "Loading processed audio...",
    })

    const drumsResponse = await fetch(drumStemUrl)
    if (!drumsResponse.ok) {
      throw new Error("Failed to load drum stem")
    }

    const drumsArrayBuffer = await drumsResponse.arrayBuffer()

    // Step 4: Decode audio
    onProgress?.({
      stage: "downloading",
      progress: 95,
      message: "Decoding audio...",
    })

    const drumsBuffer = await audioContext.decodeAudioData(drumsArrayBuffer)

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Local drum extraction complete!",
    })

    return {
      success: true,
      audioBuffer: drumsBuffer,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    onProgress?.({
      stage: "error",
      progress: 0,
      message: errorMessage,
    })

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Fallback: Client-side drum enhancement
 * This doesn't extract drums but enhances drum frequencies
 * Used when no AI service is configured
 */
export async function enhanceDrumsClientSide(
  sourceBuffer: AudioBuffer,
  audioContext: AudioContext,
): Promise<AudioBuffer> {
  const numChannels = sourceBuffer.numberOfChannels
  const length = sourceBuffer.length
  const sampleRate = sourceBuffer.sampleRate

  const drumBuffer = audioContext.createBuffer(numChannels, length, sampleRate)

  for (let channel = 0; channel < numChannels; channel++) {
    const inputData = sourceBuffer.getChannelData(channel)
    const outputData = drumBuffer.getChannelData(channel)

    // Copy original data
    for (let i = 0; i < length; i++) {
      outputData[i] = inputData[i]
    }

    // Enhance transients (drum hits)
    for (let i = 1; i < length - 1; i++) {
      const diff = Math.abs(outputData[i] - outputData[i - 1])
      if (diff > 0.02) {
        // Strong transient detected
        outputData[i] *= 1.3 // Enhance
      }
    }

    // Apply simple frequency weighting
    const frameSize = 1024
    const hopSize = 512

    for (let i = 0; i < length - frameSize; i += hopSize) {
      let energy = 0
      for (let j = 0; j < frameSize; j++) {
        energy += Math.abs(outputData[i + j])
      }

      const avgEnergy = energy / frameSize
      if (avgEnergy > 0.1) {
        // Boost drum-heavy sections
        for (let j = 0; j < frameSize; j++) {
          outputData[i + j] *= 1.2
        }
      }
    }
  }

  return drumBuffer
}

/**
 * Mock extraction for development (when no API key is available)
 */
export async function mockDrumExtraction(
  sourceBuffer: AudioBuffer,
  audioContext: AudioContext,
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<ExtractionResult> {
  // Simulate API delay
  for (let i = 0; i <= 100; i += 10) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    if (i < 30) {
      onProgress?.({
        stage: "uploading",
        progress: i,
        message: "Uploading audio... (demo mode)",
      })
    } else if (i < 90) {
      onProgress?.({
        stage: "processing",
        progress: i,
        message: "Extracting drums... (demo mode)",
      })
    } else {
      onProgress?.({
        stage: "downloading",
        progress: i,
        message: "Finalizing... (demo mode)",
      })
    }
  }

  // Use client-side enhancement as mock
  const enhancedBuffer = await enhanceDrumsClientSide(sourceBuffer, audioContext)

  onProgress?.({
    stage: "complete",
    progress: 100,
    message: "Drum extraction complete! (demo mode - configure API for better results)",
  })

  return {
    success: true,
    audioBuffer: enhancedBuffer,
  }
}

// Backward compatibility alias (for old imports)
export const extractDrumsWithLalalAI = extractDrumsWithReplicate
