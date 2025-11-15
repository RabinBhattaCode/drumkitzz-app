"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowRight,
  Check,
  ChevronRight,
  DownloadCloud,
  Mic,
  Radar,
  Sparkles,
  UploadCloud,
  Waves,
  Youtube,
} from "lucide-react"

const featureHighlights = [
  {
    icon: Sparkles,
    title: "AI-first extraction",
    description: "Industry-leading Demucs separation tuned for drums & percussion.",
  },
  {
    icon: Waves,
    title: "Sculpted one-shots",
    description: "Transient-aware slicing keeps the punch and trims the noise.",
  },
  {
    icon: Radar,
    title: "Batch everything",
    description: "Process stems, one-shots, bass, and melodic layers in one pass.",
  },
]

const instrumentOptions = [
  { value: "drums", label: "Drum Kits", hint: "Full stem & slice detection" },
  { value: "one-shots", label: "One Shots", hint: "Fast transient slicing" },
  { value: "bass", label: "Bass", hint: "Isolation with harmonic cleanup" },
  { value: "percussion", label: "Percussion", hint: "Glue shakers, rims, claps" },
  { value: "vocals", label: "Vocals", hint: "Preview future vocal mode" },
]

type CaptureAction = "record" | "upload" | "youtube" | null

export default function ExtractorExperimentPage() {
  const [instrument, setInstrument] = useState<string>("drums")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [lastAction, setLastAction] = useState<CaptureAction>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter((file) => file.type.includes("audio"))

    if (files.length === 0) {
      toast({
        title: "Unsupported files",
        description: "Please add audio files to continue.",
        variant: "destructive",
      })
      return
    }

    setSelectedFiles(files)
    setLastAction("upload")
    toast({
      title: `${files.length} file${files.length > 1 ? "s" : ""} ready`,
      description: "Head to the full editor to slice, tag, and export.",
    })
  }, [toast])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      event.stopPropagation()
      handleFiles(event.dataTransfer.files)
    },
    [handleFiles],
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleRecord = useCallback(() => {
    setLastAction("record")
    toast({
      title: "Recording available in editor",
      description: "We’ll launch the classic interface with recording enabled.",
    })
    router.push("/?view=classic&open=record")
  }, [router, toast])

  const handleYouTube = useCallback(() => {
    setLastAction("youtube")
    toast({
      title: "YouTube extraction",
      description: "Paste a link inside the classic editor to begin.",
    })
    router.push("/?view=classic&open=youtube")
  }, [router, toast])

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }, [])

  const selectedFilesSummary = useMemo(() => {
    if (selectedFiles.length === 0) return null

    const totalBytes = selectedFiles.reduce((acc, file) => acc + file.size, 0)
    return {
      count: selectedFiles.length,
      size: formatBytes(totalBytes),
      names: selectedFiles.slice(0, 3).map((file) => file.name),
    }
  }, [selectedFiles, formatBytes])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 md:flex-row md:items-center md:py-20">
        <section className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur">
            <Badge variant="secondary" className="bg-white/15 text-white">
              Prototype
            </Badge>
            <span>Modern extraction flow — work-in-progress</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Extract drum kits, one shots, bass and more in seconds.
            </h1>
            <p className="text-lg text-white/70 md:text-xl">
              Feed any stem or full mix. Our AI isolates the energy, cleans the noise, and hands you studio-ready slices
              inside the DrumKitzz editor.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureHighlights.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5/70 p-4 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm text-white/70">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <div className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Unlimited previews
            </div>
            <div className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Lossless exports
            </div>
            <div className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Marketplace ready metadata
            </div>
          </div>
        </section>

        <section className="flex-1">
          <Card className="relative overflow-hidden border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl" />
            <CardHeader className="relative space-y-2">
              <Badge className="w-fit bg-indigo-500/40 text-xs uppercase tracking-wider text-white">Step 1</Badge>
              <CardTitle className="text-2xl text-white md:text-3xl">
                Select instrument type & choose files
              </CardTitle>
              <p className="text-sm text-white/70">
                Upload up to 20 files per batch. We’ll split, analyze, and prep your slices automatically.
              </p>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <div className="space-y-3">
                <Label className="text-sm uppercase tracking-wide text-white/60">Instrument focus</Label>
                <RadioGroup
                  value={instrument}
                  onValueChange={setInstrument}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {instrumentOptions.map(({ value, label, hint }) => {
                    const id = `instrument-${value}`
                    return (
                      <Label
                        key={value}
                        htmlFor={id}
                        className={cn(
                          "group relative flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
                          instrument === value && "border-indigo-400/70 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(129,140,248,0.4)]",
                        )}
                      >
                        <RadioGroupItem
                          id={id}
                          value={value}
                          className="absolute right-3 top-3 h-4 w-4 border-white/40 text-indigo-200"
                        />
                        <span className="text-base font-semibold">{label}</span>
                        <span className="text-xs text-white/70">{hint}</span>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="file-upload" className="text-sm uppercase tracking-wide text-white/60">
                  Upload or drag files
                </Label>
                <label
                  htmlFor="file-upload"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  className="mt-2 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-center transition hover:border-white/40 hover:bg-white/10"
                >
                  <DownloadCloud className="h-10 w-10 text-indigo-200" />
                  <div>
                    <p className="text-base font-semibold text-white">
                      Drop audio files here or
                      <button
                        type="button"
                        className="ml-1 inline-flex items-center gap-1 text-indigo-200 underline-offset-2 hover:underline"
                        onClick={(event) => {
                          event.preventDefault()
                          fileInputRef.current?.click()
                        }}
                      >
                        browse
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </p>
                    <p className="text-xs text-white/60">Accepted: WAV, AIFF, FLAC, MP3 · up to 1GB total</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(
                    "flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 text-center text-white hover:border-white/30 hover:bg-white/20",
                    lastAction === "record" && "border-indigo-400/70",
                  )}
                  onClick={handleRecord}
                >
                  <Mic className="h-5 w-5" />
                  <span className="text-sm font-medium">Record</span>
                  <span className="text-[11px] uppercase tracking-wide text-white/60">Live capture</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className={cn(
                    "flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 text-center text-white hover:border-white/30 hover:bg-white/20",
                    lastAction === "upload" && "border-indigo-400/70",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-5 w-5" />
                  <span className="text-sm font-medium">Upload</span>
                  <span className="text-[11px] uppercase tracking-wide text-white/60">Drag & drop</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className={cn(
                    "flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 text-center text-white hover:border-white/30 hover:bg-white/20",
                    lastAction === "youtube" && "border-indigo-400/70",
                  )}
                  onClick={handleYouTube}
                >
                  <Youtube className="h-5 w-5" />
                  <span className="text-sm font-medium">YouTube</span>
                  <span className="text-[11px] uppercase tracking-wide text-white/60">Paste link</span>
                </Button>
              </div>

              {selectedFilesSummary ? (
                <div className="rounded-2xl border border-emerald-400/60 bg-emerald-500/10 p-4 text-emerald-100">
                  <p className="text-sm font-semibold">
                    {selectedFilesSummary.count} file{selectedFilesSummary.count > 1 ? "s" : ""} queued ·{" "}
                    {selectedFilesSummary.size}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {selectedFilesSummary.names.map((name) => (
                      <li key={name} className="truncate text-emerald-50">
                        {name}
                      </li>
                    ))}
                    {selectedFilesSummary.count > selectedFilesSummary.names.length && (
                      <li className="text-emerald-200/70">
                        +{selectedFilesSummary.count - selectedFilesSummary.names.length} more
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
                  <p className="font-medium text-white">No files yet</p>
                  <p className="text-xs text-white/60">
                    Drag in stems or start a recording to preview how the new flow feels. This prototype sends you back
                    to the classic editor for slicing.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Next: refine slices, tag metadata, export
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30">
                    Open classic editor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-transparent bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-400"
                    onClick={() => {
                      toast({
                        title: "Prototype flow",
                        description: "We’ll forward your selections to the classic editor soon.",
                      })
                    }}
                  >
                    Continue (prototype)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
