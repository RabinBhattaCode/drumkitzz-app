import { createHash } from "crypto"

// Allowed file types and their corresponding MIME types
const ALLOWED_FILE_TYPES = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
}

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export type FileValidationResult = {
  valid: boolean
  error?: string
  fileInfo?: {
    name: string
    type: string
    size: number
    hash: string
  }
}

export async function validateFile(file: File, type: "audio" | "image"): Promise<FileValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES[type].join(", ")}`,
    }
  }

  // Generate file hash for integrity checking
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const hash = createHash("sha256").update(buffer).digest("hex")

  return {
    valid: true,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size,
      hash,
    },
  }
}

// Function to sanitize filenames to prevent path traversal attacks
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const sanitized = filename.replace(/^.*[\\/]/, "")

  // Remove any non-alphanumeric characters except for periods, hyphens, and underscores
  return sanitized.replace(/[^a-zA-Z0-9._-]/g, "_")
}

// Generate a secure random filename
export function generateSecureFilename(originalFilename: string): string {
  const extension = originalFilename.split(".").pop() || ""
  const randomString = Math.random().toString(36).substring(2, 15)
  const timestamp = Date.now()

  return `${timestamp}-${randomString}.${extension}`
}
