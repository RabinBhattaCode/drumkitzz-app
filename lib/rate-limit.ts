import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Lazy initialization of Redis client to avoid build-time errors
let redis: Redis | null = null

function getRedisClient() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    // Only create client if env vars are available
    if (url && token) {
      redis = new Redis({ url, token })
    }
  }
  return redis
}

type RateLimitConfig = {
  limit: number
  window: number // in seconds
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { limit: 10, window: 60 },
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const client = getRedisClient()

  // If Redis not configured, allow all requests (graceful degradation)
  if (!client) {
    console.warn("Redis not configured, rate limiting disabled")
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Math.floor(Date.now() / 1000) + config.window,
    }
  }

  const ip = request.ip || "127.0.0.1"
  const path = request.nextUrl.pathname

  // Create a unique key for this IP and endpoint
  const key = `rate-limit:${ip}:${path}`

  // Get the current count and timestamp
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window

  // Remove old requests and add the current one
  await client.zremrangebyscore(key, 0, windowStart)
  await client.zadd(key, { score: now, member: now.toString() })

  // Set expiry on the key
  await client.expire(key, config.window)

  // Count requests in the current window
  const count = await client.zcard(key)

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, config.limit - count)
  const reset = now + config.window

  return {
    success: count <= config.limit,
    limit: config.limit,
    remaining,
    reset,
  }
}

// Example usage in an API route
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config?: RateLimitConfig,
): Promise<NextResponse> {
  const result = await rateLimit(request, config)

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
        },
      },
    )
  }

  const response = await handler()

  // Add rate limit headers to the response
  response.headers.set("X-RateLimit-Limit", result.limit.toString())
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
  response.headers.set("X-RateLimit-Reset", result.reset.toString())

  return response
}
