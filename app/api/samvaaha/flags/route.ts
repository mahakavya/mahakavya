import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { z } from "zod"

const createFlagSchema = z.object({
  content_type: z.enum(["post", "comment"]),
  content_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, "create_flag")
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 5),
        },
      )
    }

    const body = await request.json()
    const validatedData = createFlagSchema.parse(body)

    // Check if content exists
    const tableName = validatedData.content_type === "post" ? "posts" : "comments"
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select("id")
      .eq("id", validatedData.content_id)
      .single()

    if (contentError) {
      if (contentError.code === "PGRST116") {
        return NextResponse.json({ error: "Content not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
    }

    // Check if user already flagged this content
    const { data: existingFlag, error: flagCheckError } = await supabase
      .from("moderation_flags")
      .select("id")
      .eq("content_type", validatedData.content_type)
      .eq("content_id", validatedData.content_id)
      .eq("reporter_id", user.id)
      .single()

    if (flagCheckError && flagCheckError.code !== "PGRST116") {
      console.error("Error checking existing flag:", flagCheckError)
      return NextResponse.json({ error: "Failed to check flag status" }, { status: 500 })
    }

    if (existingFlag) {
      return NextResponse.json({ error: "Content already flagged by user" }, { status: 409 })
    }

    // Create moderation flag
    const { data: flag, error: flagError } = await supabase
      .from("moderation_flags")
      .insert({
        content_type: validatedData.content_type,
        content_id: validatedData.content_id,
        reporter_id: user.id,
        reason: validatedData.reason,
      })
      .select("*")
      .single()

    if (flagError) {
      console.error("Error creating flag:", flagError)
      return NextResponse.json({ error: "Failed to create flag" }, { status: 500 })
    }

    return NextResponse.json(
      {
        flag: {
          id: flag.id,
          status: flag.status,
          created_at: flag.created_at,
        },
      },
      {
        headers: getRateLimitHeaders(rateLimitResult.remaining - 1, rateLimitResult.resetTime, 5),
      },
    )
  } catch (error) {
    console.error("Error in POST /api/samvaaha/flags:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
