/**
 * Shared project payload helpers for saving/loading kit projects.
 * This keeps the drum-slicer-pro client aligned with the /api/projects contract.
 */

export type SlicePayload = {
  id?: string
  name?: string
  type?: string
  start_time: number
  end_time: number
  fade_in_ms?: number
  fade_out_ms?: number
  metadata?: Record<string, unknown>
}

export type ProjectPayload = {
  projectId?: string
  title: string
  sourceAudioPath?: string | null
  sourceDuration?: number | null
  sliceSettings?: Record<string, unknown>
  playbackConfig?: Record<string, unknown>
  fxChains?: Record<string, unknown>
  notes?: string | null
  slices?: SlicePayload[]
}

export async function saveProject(payload: ProjectPayload) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: payload.projectId,
      title: payload.title,
      sourceAudioPath: payload.sourceAudioPath,
      sourceDuration: payload.sourceDuration,
      sliceSettings: payload.sliceSettings,
      playbackConfig: payload.playbackConfig,
      fxChains: payload.fxChains,
      notes: payload.notes,
      slices: payload.slices?.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        start_time: s.start_time,
        end_time: s.end_time,
        fade_in_ms: s.fade_in_ms,
        fade_out_ms: s.fade_out_ms,
        metadata: s.metadata ?? {},
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error || "Failed to save project")
  }

  return (await response.json()) as { projectId: string; project: any }
}

export async function loadProject(projectId: string) {
  const response = await fetch(`/api/projects?projectId=${encodeURIComponent(projectId)}`, {
    method: "GET",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error || "Failed to load project")
  }

  return (await response.json()) as {
    project: {
      id: string
      title: string
      source_audio_path: string | null
      source_duration: number | null
      slice_settings: Record<string, unknown> | null
      playback_config: Record<string, unknown> | null
      fx_chains: Record<string, unknown> | null
      notes: string | null
      kit_slices: Array<{
        id: string
        name: string | null
        type: string | null
        start_time: number
        end_time: number
        fade_in_ms: number
        fade_out_ms: number
        metadata: Record<string, unknown> | null
      }>
    }
    assets?: Array<{
      id: string
      asset_type: string | null
      storage_path: string
      signedUrl?: string
    }>
  }
}
