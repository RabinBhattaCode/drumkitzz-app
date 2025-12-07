import { loadProject as loadProjectFromApi } from "./projects"

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numberOfChannels = buffer.numberOfChannels
  const length = buffer.length * numberOfChannels * 2
  const sampleRate = buffer.sampleRate

  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)

  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + length, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * 2, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, "data")
  view.setUint32(40, length, true)

  const audioData = new Int16Array(buffer.length * numberOfChannels)
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel)
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      audioData[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }
  }

  return new Blob([wavHeader, audioData], { type: "audio/wav" })
}

const applyFades = (
  source: AudioBuffer,
  start: number,
  end: number,
  fadeInMs: number,
  fadeOutMs: number,
  audioContext: AudioContext,
) => {
  const sampleRate = source.sampleRate
  const startSample = Math.floor(start * sampleRate)
  const endSample = Math.floor(end * sampleRate)
  const length = Math.max(0, endSample - startSample)
  const out = audioContext.createBuffer(source.numberOfChannels, length, sampleRate)
  for (let channel = 0; channel < source.numberOfChannels; channel++) {
    const src = source.getChannelData(channel)
    const dst = out.getChannelData(channel)
    const fadeInSamples = Math.floor((fadeInMs / 1000) * sampleRate)
    const fadeOutSamples = Math.floor((fadeOutMs / 1000) * sampleRate)
    for (let i = 0; i < length; i++) {
      let sample = src[startSample + i] || 0
      if (i < fadeInSamples && fadeInSamples > 0) {
        sample *= i / fadeInSamples
      }
      if (i > length - fadeOutSamples && fadeOutSamples > 0) {
        sample *= (length - i) / fadeOutSamples
      }
      dst[i] = sample
    }
  }
  return out
}

export const downloadProjectZip = async (projectId: string, titleFallback?: string) => {
  const { project: loadedProject, assets } = await loadProjectFromApi(projectId)

  const slices = (loadedProject.kit_slices || []).map((s: any, idx: number) => ({
    id: s.id || `slice-${idx}`,
    name: s.name || `Slice-${idx + 1}`,
    type: s.type || "perc",
    start: Number(s.start_time),
    end: Number(s.end_time),
    fadeIn: s.fade_in_ms ?? 0,
    fadeOut: s.fade_out_ms ?? 0,
  }))

  if (slices.length === 0) {
    throw new Error("No slices found to export.")
  }

  const stemAsset =
    assets?.find((a: any) => a.asset_type === "stem" && (a.signedUrl || a.storage_path)) ||
    assets?.find((a: any) => a.signedUrl || a.storage_path)
  const isAbsoluteUrl = (value?: string | null) => !!value && /^https?:\/\//i.test(value)
  const candidateUrl = stemAsset?.signedUrl
    ? stemAsset.signedUrl
    : isAbsoluteUrl(stemAsset?.storage_path)
      ? `/api/proxy-audio?url=${encodeURIComponent(stemAsset?.storage_path || "")}`
      : isAbsoluteUrl(loadedProject.source_audio_path)
        ? `/api/proxy-audio?url=${encodeURIComponent(loadedProject.source_audio_path || "")}`
        : null

  if (!candidateUrl) {
    throw new Error("No audio source found for this project.")
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  try {
    const res = await fetch(candidateUrl)
    if (!res.ok) {
      throw new Error(`Audio fetch failed (${res.status})`)
    }
    const arrayBuffer = await res.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))

    const { default: JSZip } = await import("jszip")
    const zip = new JSZip()
    slices.forEach((slice: any) => {
      const buffer = applyFades(audioBuffer, slice.start, slice.end, slice.fadeIn, slice.fadeOut, audioContext)
      if (!buffer) return
      const wav = bufferToWav(buffer)
      const folder = zip.folder(slice.type ? slice.type.toLowerCase() : "samples")
      folder?.file(`${slice.name}.wav`, wav)
    })

    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    a.download = `${titleFallback || loadedProject.title || "DrumKitzz_Kit"}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } finally {
    audioContext.close().catch(() => {})
  }
}
