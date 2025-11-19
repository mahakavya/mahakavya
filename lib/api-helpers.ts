import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitHeaders, rateLimitResponse, type RATE_LIMITS } from "./rate-limit-enhanced"
import { captureError } from "./sentry"
import { createClient } from "./supabase/server"

export interface ApiContext {
  userId: string
  isAdmin: boolean
  supabase: Awaited<ReturnType<typeof createClient>>
}

export async function withAuth(request: NextRequest): Promise<ApiContext | NextResponse> {
  try {
    const supabase = await createClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

    return {
      userId: session.user.id,
      isAdmin: profile?.is_admin || false,
      supabase,
    }
  } catch (error) {
    captureError(error, { context: "withAuth" })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function withRateLimit(userId: string, action: keyof typeof RATE_LIMITS): Promise<NextResponse | null> {
  const rateLimit = await checkRateLimit(userId, action)

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime, rateLimit.limit)
  }

  return null
}

export function apiResponse(data: any, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  })
}

export function apiError(message: string, status = 400, details?: any) {
  const error = {
    error: message,
    ...(details && { details }),
  }

  captureError(new Error(message), details)

  return NextResponse.json(error, { status })
}

export async function withAuthAndRateLimit(
  request: NextRequest,
  action: keyof typeof RATE_LIMITS,
): Promise<
  | {
      context: ApiContext
      rateLimitHeaders: Record<string, string>
    }
  | NextResponse
> {
  // Check authentication
  const authResult = await withAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  // Check rate limit
  const rateLimitResult = await withRateLimit(authResult.userId, action)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Get rate limit headers for successful request
  const rateLimit = await checkRateLimit(authResult.userId, action)

  return {
    context: authResult,
    rateLimitHeaders: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime, rateLimit.limit),
  }
}
