import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

// Allow MP3 + WAV uploads
const audioConfig = {
  "audio/mpeg": { maxFileSize: "32MB" },
  "audio/wav": { maxFileSize: "32MB" },
  "audio/x-wav": { maxFileSize: "32MB" },
  "audio/wave": { maxFileSize: "32MB" },
} as const

export const audioFileRouter = {
  kitAudio: f(audioConfig)
    .middleware(async () => {
      // TODO: replace with Supabase auth lookup (Phase 1)
      return {
        userId: null,
      }
    })
    .onUploadError(({ error }) => {
      console.error("UploadThing error:", error)
    })
    .onUploadComplete(async ({ file }) => {
      return {
        fileUrl: file.url,
        fileKey: file.key,
      }
    }),
} satisfies FileRouter

export type AudioFileRouter = typeof audioFileRouter
