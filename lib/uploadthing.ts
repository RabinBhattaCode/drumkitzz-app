import { generateReactHelpers } from "@uploadthing/react"

import type { AudioFileRouter } from "@/app/api/uploadthing/core"

export const { useUploadThing, uploadFiles } = generateReactHelpers<AudioFileRouter>()
