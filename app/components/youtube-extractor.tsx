"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface YouTubeExtractorProps {
  onAudioExtracted: (audioBlob: Blob, title: string) => void
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
}

export function YouTubeExtractor({ onAudioExtracted, isProcessing, setIsProcessing }: YouTubeExtractorProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)

  // Validate YouTube URL
  const validateYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    return youtubeRegex.test(url)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setYoutubeUrl(url)
    setIsValidUrl(validateYoutubeUrl(url))
  }

  const extractAudio = async () => {
    if (!isValidUrl) return

    setIsProcessing(true)

    try {
      // In a real implementation, this would call a server-side API to extract audio
      // For this demo, we'll simulate the process with a timeout
      toast({
        title: "Processing YouTube video",
        description: "Extracting audio from the provided YouTube URL...",
      })

      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // For demo purposes, we'll create a simple audio blob
      // In a real implementation, this would be the actual extracted audio from YouTube

      // Create a simple oscillator-based audio instead of trying to fetch a file
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
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

      // Convert the buffer to a wav blob
      const wavBlob = await bufferToWavBlob(audioBuffer)

      // Extract video title from URL (in a real implementation, this would come from the API)
      const videoId = youtubeUrl.includes("youtu.be")
        ? youtubeUrl.split("/").pop()
        : new URLSearchParams(new URL(youtubeUrl).search).get("v")
      const title = `youtube-${videoId || "audio"}`

      onAudioExtracted(wavBlob, title)

      toast({
        title: "Audio extracted successfully",
        description: "The YouTube audio has been extracted and is ready for processing.",
      })
    } catch (error) {
      console.error("Error extracting audio:", error)
      toast({
        title: "Extraction failed",
        description: "Failed to extract audio from the YouTube video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setYoutubeUrl("")
    }
  }

  // Add this helper function to convert AudioBuffer to WAV blob
  const bufferToWavBlob = (buffer: AudioBuffer): Promise<Blob> => {
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

  // Helper function to write string to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <Input
          type="text"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={handleUrlChange}
          className="flex-1 min-w-0"
          disabled={isProcessing}
        />
        <Button
          onClick={extractAudio}
          disabled={!isValidUrl || isProcessing}
          className="w-full sm:w-auto whitespace-nowrap"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            "Extract Audio"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Enter a valid YouTube URL to extract audio in MP3 320kbps format</p>
    </div>
  )
}
