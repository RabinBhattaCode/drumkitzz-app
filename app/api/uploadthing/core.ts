import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const audioFileRouter = {
  kitAudio: f({ "audio/mpeg": { maxFileSize: "32MB" } })
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
