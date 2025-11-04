import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
})

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
  const ip = request.ip || "127.0.0.1"
  const path = request.nextUrl.pathname

  // Create a unique key for this IP and endpoint
  const key = `rate-limit:${ip}:${path}`

  // Get the current count and timestamp
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window

  // Remove old requests and add the current one
  await redis.zremrangebyscore(key, 0, windowStart)
  await redis.zadd(key, { score: now, member: now.toString() })

  // Set expiry on the key
  await redis.expire(key, config.window)

  // Count requests in the current window
  const count = await redis.zcard(key)

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
