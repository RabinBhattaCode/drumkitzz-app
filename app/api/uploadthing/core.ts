import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

// Allow MP3 + WAV uploads
const audioConfig = {
  "audio/mpeg": { maxFileSize: "32MB" },
  "audio/wav": { maxFileSize: "32MB" },
  "audio/x-wav": { maxFileSize: "32MB" },
  "audio/wave": { maxFileSize: "32MB" },
} as const

// Allow common image uploads (PNG/JPEG/WEBP) up to 8MB
const imageConfig = {
  "image/png": { maxFileSize: "8MB" },
  "image/jpeg": { maxFileSize: "8MB" },
  "image/jpg": { maxFileSize: "8MB" },
  "image/webp": { maxFileSize: "8MB" },
} as const

const imageUploader = (type: "profileAvatar" | "profileBackdrop" | "kitArtwork") =>
  f(imageConfig)
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
        type,
      }
    })

export const appFileRouter = {
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
  profileAvatar: imageUploader("profileAvatar"),
  profileBackdrop: imageUploader("profileBackdrop"),
  kitArtwork: imageUploader("kitArtwork"),
} satisfies FileRouter

export type AppFileRouter = typeof appFileRouter
