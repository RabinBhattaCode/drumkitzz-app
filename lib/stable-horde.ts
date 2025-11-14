const HORDE_URL = "https://stablehorde.net/api/v2"
const DEFAULT_MODEL = "SDXL_beta"
const POLL_INTERVAL_MS = 4000
const MAX_WAIT_MS = 120000

export interface HordeGenerationRequest {
  prompt: string
  model?: string
  width?: number
  height?: number
  steps?: number
  seed?: number
}

interface HordeJobResponse {
  id: string
}

interface HordeStatusResponse {
  state?: string
  done?: boolean
  finished?: boolean
  generations?: Array<{
    img: string
    model?: string
    seed?: number
    id?: string
  }>
  message?: string
}

const hordeHeaders = () => {
  const key = process.env.STABLE_HORDE_KEY
  if (!key) {
    throw new Error("STABLE_HORDE_KEY is not configured")
  }

  return {
    "Content-Type": "application/json",
    apikey: key,
  }
}

export async function submitHordeImageJob({
  prompt,
  model = DEFAULT_MODEL,
  width = 512,
  height = 512,
  steps = 25,
  seed,
}: HordeGenerationRequest): Promise<HordeJobResponse> {
  const body = {
    prompt,
    params: {
      n: 1,
      steps,
      width,
      height,
      seed,
      sampler_name: "k_euler",
    },
    models: [model],
  }

  const response = await fetch(`${HORDE_URL}/generate/async`, {
    method: "POST",
    headers: hordeHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Horde submit failed: ${response.status} ${text}`)
  }

  return (await response.json()) as HordeJobResponse
}

export async function checkHordeImageStatus(id: string): Promise<HordeStatusResponse> {
  const res = await fetch(`${HORDE_URL}/generate/status/${id}`, {
    headers: hordeHeaders(),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Horde status failed: ${res.status} ${text}`)
  }

  return (await res.json()) as HordeStatusResponse
}

export async function waitForHordeImage(id: string) {
  const started = Date.now()
  while (Date.now() - started < MAX_WAIT_MS) {
    const status = await checkHordeImageStatus(id)
    const finished = status.finished ?? status.done ?? status.state === "completed"
    if (finished && status.generations?.length) {
      return status.generations[0]
    }

    if (status.state === "faulted" || status.state === "cancelled") {
      throw new Error(status.message || "Horde generation failed")
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  throw new Error("Timed out waiting for Horde generation")
}
