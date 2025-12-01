import { type NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export const maxDuration = 300 // 5 minutes for audio processing

interface ReplicateOutput {
  drums?: string
  bass?: string
  vocals?: string
  other?: string
}

const LALAL_UPLOAD_ENDPOINT = "https://www.lalal.ai/api/upload/"
const LALAL_SPLIT_ENDPOINT = "https://www.lalal.ai/api/split/"
const LALAL_CHECK_ENDPOINT = "https://www.lalal.ai/api/check/"

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

const LALAL_SPLITTER = process.env.LALAL_SPLITTER || "phoenix"
const LALAL_ENHANCED_PROCESSING = process.env.LALAL_ENHANCED_PROCESSING !== "false"

function normalizeStem(stem: LalalStem) {
  if (stem === "voice" || stem === "vocals") return "vocals"
  if (stem === "drum") return "drums"
  return stem
}

async function mirrorToSupabase({
  userId,
  projectId,
  kitId,
  stemUrl,
  originalFilename = "stem.wav",
}: {
  userId?: string
  projectId?: string | null
  kitId?: string | null
  stemUrl: string
  originalFilename?: string
}) {
  if (!userId || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const response = await fetch(stemUrl)
  if (!response.ok) throw new Error(`Failed to fetch stem for Supabase upload: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const ext = originalFilename.includes(".") ? `.${originalFilename.split(".").pop()}` : ".wav"
  const path = [userId, projectId || kitId || "unassigned", `stem-${Date.now()}${ext}`].join("/")

  const { error: uploadError } = await supabase.storage.from("stems").upload(path, buffer, {
    contentType: "audio/wav",
    cacheControl: "3600",
    upsert: true,
  })
  if (uploadError) throw new Error(uploadError.message)

  const { data: signed, error: signedError } = await supabase.storage.from("stems").createSignedUrl(path, 60 * 60)
  if (signedError) throw new Error(signedError.message)

  // Insert kit_assets row (best-effort)
  try {
    await supabase.from("kit_assets").insert({
      owner_id: userId,
      project_id: projectId || null,
      kit_id: kitId || null,
      asset_type: "stem",
      storage_path: path,
      size_bytes: buffer.length,
    })
  } catch (err) {
    console.warn("kit_assets insert failed:", err instanceof Error ? err.message : err)
  }

  return { path, signedUrl: signed.signedUrl }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const action = formData.get("action") as string
    const userId = (formData.get("userId") as string | null) || undefined
    const projectId = (formData.get("projectId") as string | null) || undefined
    const kitId = (formData.get("kitId") as string | null) || undefined
    const requestedStem = (formData.get("stem") as LalalStem | null) || "drum"
    const stem: LalalStem = LALAL_ALLOWED_STEMS.includes(requestedStem) ? requestedStem : "drum"

    if (!audioFile && action === "upload") {
      return NextResponse.json({ success: false, error: "No audio file provided" }, { status: 400 })
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN
    const useLocalDemucs = process.env.USE_LOCAL_DEMUCS === "true"
    const lalalLicenseKey = process.env.LALAL_AI_LICENSE_KEY

    // Option 1: Lalal.ai stem separation (preferred when license is provided)
    if (!useLocalDemucs && lalalLicenseKey) {
      // Upload audio and start Lalal split task
      if (action === "upload") {
        if (!audioFile) {
          return NextResponse.json({ success: false, error: "No audio file provided" }, { status: 400 })
        }

        try {
          const bytes = Buffer.from(await audioFile.arrayBuffer())
          const filename = audioFile.name || "audio.wav"

          const uploadResponse = await fetch(LALAL_UPLOAD_ENDPOINT, {
            method: "POST",
            headers: {
              Authorization: `license ${lalalLicenseKey}`,
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
            body: bytes,
          })

          const uploadData = (await uploadResponse.json()) as {
            status: string
            id?: string
            error?: string
          }

          if (uploadData.status !== "success" || !uploadData.id) {
            throw new Error(uploadData.error || "Failed to upload audio to Lalal.ai")
          }

          const splitPayload = new URLSearchParams({
            id: uploadData.id,
            stem,
            splitter: LALAL_SPLITTER,
          })

          if (LALAL_ENHANCED_PROCESSING) {
            splitPayload.append("enhanced_processing_enabled", "true")
          }

          const splitResponse = await fetch(LALAL_SPLIT_ENDPOINT, {
            method: "POST",
            headers: {
              Authorization: `license ${lalalLicenseKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: splitPayload,
          })

          const splitData = (await splitResponse.json()) as {
            status: string
            task_id?: string
            error?: string
          }

          if (splitData.status !== "success") {
            throw new Error(splitData.error || "Failed to start Lalal.ai split job")
          }

          return NextResponse.json({
            success: true,
            predictionId: uploadData.id,
            status: "processing",
            provider: "lalal",
            taskId: splitData.task_id,
            message: `Stem extraction started with Lalal.ai (${stem}, splitter=${LALAL_SPLITTER})`,
            stem,
          })
        } catch (error) {
          console.error("Lalal.ai upload error:", error)
          return NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Failed to start Lalal.ai extraction",
            },
            { status: 500 },
          )
        }
      }

      if (action === "check") {
        const predictionId = formData.get("predictionId") as string
        const stemFromClient = (formData.get("stem") as LalalStem | null) || stem
        const normalizedStem = normalizeStem(stemFromClient)

        if (!predictionId) {
          return NextResponse.json({ success: false, error: "No prediction ID provided" }, { status: 400 })
        }

        try {
          const checkResponse = await fetch(LALAL_CHECK_ENDPOINT, {
            method: "POST",
            headers: {
              Authorization: `license ${lalalLicenseKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              id: predictionId,
            }),
          })

          const checkData = (await checkResponse.json()) as {
            status: string
            error?: string
            result?: Record<
              string,
              {
                status: string
                error?: string
                split?: {
                  duration?: number
                  stem?: string
                  stem_track?: string
                  back_track?: string
                }
                task?: {
                  state?: string
                  progress?: number
                  error?: string
                }
              }
            >
            task?: {
              state?: string
              progress?: number
              error?: string
            }
            split?: {
              duration?: number
              stem?: string
              stem_track?: string
              back_track?: string
            }
          }

          if (checkData.status !== "success") {
            throw new Error(checkData.error || "Failed to check Lalal.ai status")
          }

          // Lalal sometimes nests the result under result[id], sometimes returns top-level task/split
          const fileResult =
            checkData.result?.[predictionId] ||
            (checkData.task || checkData.split
              ? {
                  task: checkData.task,
                  split: checkData.split,
                  status: checkData.status,
                  error: checkData.error,
                }
              : null)

          if (!fileResult) {
            throw new Error("No status available for requested file")
          }

          if (fileResult.split?.stem_track) {
            let supabaseUpload: { path: string; signedUrl: string } | null = null
            if (process.env.SUPABASE_UPLOAD_RESULTS === "true") {
              try {
                supabaseUpload = await mirrorToSupabase({
                  userId,
                  projectId,
                  kitId,
                  stemUrl: fileResult.split.stem_track,
                  originalFilename: audioFile?.name ?? "stem.wav",
                })
              } catch (err) {
                console.warn("Supabase mirror skipped:", err instanceof Error ? err.message : err)
              }
            }

            return NextResponse.json({
              success: true,
              status: "succeeded",
              output: {
                stemUrl: fileResult.split.stem_track,
                backTrackUrl: fileResult.split.back_track,
                stem: normalizeStem((fileResult.split.stem as LalalStem | undefined) ?? normalizedStem),
                duration: fileResult.split.duration,
                supabaseUploads: supabaseUpload ? [supabaseUpload] : [],
              },
            })
          }

          if (fileResult.task?.state === "error" || fileResult.status === "error") {
            return NextResponse.json({
              success: false,
              status: "failed",
              error: fileResult.task?.error || fileResult.error || "Lalal.ai task failed",
            })
          }

          const progress = fileResult.task?.progress ?? null

          return NextResponse.json({
            success: true,
            status: "processing",
            progress,
          })
        } catch (error) {
          console.error("Lalal.ai status check error:", error)
          return NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Failed to check Lalal.ai status",
            },
            { status: 500 },
          )
        }
      }
    }

    // Option 2: Replicate API
    if (!useLocalDemucs && replicateToken) {
      if (action === "upload") {
        try {
          const replicate = new Replicate({
            auth: replicateToken,
          })

          // Convert file to base64 data URI for Replicate
          const bytes = await audioFile.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const base64 = buffer.toString("base64")
          const mimeType = audioFile.type || "audio/wav"
          const dataUri = `data:${mimeType};base64,${base64}`

          // Start Demucs prediction
          const prediction = await replicate.predictions.create({
            version: "b76242b40d606da8c8f34d0e434d1e8a6c93f1c34e4e0b03f4fa84247adbfbdc", // Demucs latest
            input: {
              audio: dataUri,
              stem: "drums", // Extract only drums
            },
          })

          return NextResponse.json({
            success: true,
            predictionId: prediction.id,
            status: prediction.status,
            message: "Drum extraction started with Replicate AI",
          })
        } catch (error) {
          console.error("Replicate API error:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to start Replicate extraction",
              details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      }

      // Check status
      if (action === "check") {
        const predictionId = formData.get("predictionId") as string

        if (!predictionId) {
          return NextResponse.json({ success: false, error: "No prediction ID provided" }, { status: 400 })
        }

        try {
          const replicate = new Replicate({
            auth: replicateToken,
          })

          const prediction = await replicate.predictions.get(predictionId)

          return NextResponse.json({
            success: true,
            status: prediction.status,
            output: prediction.output as ReplicateOutput,
            error: prediction.error,
          })
        } catch (error) {
          console.error("Replicate status check error:", error)
          return NextResponse.json({ success: false, error: "Failed to check status" }, { status: 500 })
        }
      }
    }

    // Option 3: Local Demucs (100% free but requires Python setup)
    if (useLocalDemucs) {
      if (action === "local-extract") {
        // Save file temporarily and run Demucs locally
        // This requires a Python subprocess handler
        // For now, return not implemented
        return NextResponse.json(
          {
            success: false,
            error: "Local Demucs not yet implemented. Please use Replicate API or disable USE_LOCAL_DEMUCS.",
          },
          { status: 501 },
        )
      }
    }

    // Option 4: No API configured - return mock/demo mode
    if (!lalalLicenseKey && !replicateToken && !useLocalDemucs) {
      console.warn("No AI extraction configured. Using demo mode.")
      return NextResponse.json({
        success: true,
        predictionId: "demo-" + Date.now(),
        status: "processing",
        message:
          "Demo mode: No API key configured. Audio will be enhanced client-side. For full AI extraction, add REPLICATE_API_TOKEN to .env.local",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in drum extraction:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
