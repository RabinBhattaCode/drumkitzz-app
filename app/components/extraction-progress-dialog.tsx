"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import type { ExtractionProgress } from "@/lib/audio-extraction"

interface ExtractionProgressDialogProps {
  isOpen: boolean
  progress: ExtractionProgress
  onClose?: () => void
}

export function ExtractionProgressDialog({ isOpen, progress, onClose }: ExtractionProgressDialogProps) {
  const getIcon = () => {
    switch (progress.stage) {
      case "complete":
        return <CheckCircle2 className="h-12 w-12 text-green-500" />
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
    }
  }

  const getTitle = () => {
    switch (progress.stage) {
      case "uploading":
        return "Uploading Audio"
      case "processing":
        return "Extracting Drums"
      case "downloading":
        return "Downloading Results"
      case "complete":
        return "Extraction Complete!"
      case "error":
        return "Extraction Failed"
      default:
        return "Processing"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </DialogTitle>
          <DialogDescription className="text-center">{progress.message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Progress value={progress.progress} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">{progress.progress.toFixed(0)}%</div>

          {progress.stage === "processing" && (
            <div className="text-xs text-center text-muted-foreground">
              This process typically takes 1-3 minutes depending on audio length
            </div>
          )}

          {progress.stage === "error" && (
            <div className="text-sm text-center text-red-500">
              Please try again or contact support if the issue persists
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
