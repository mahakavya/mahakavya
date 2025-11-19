import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { sanitizeText } from "@/lib/sanitize"
import { signUpload, generateMediaPath, validateMediaFile, getMediaType } from "@/lib/storage"
import { z } from "zod"

const createPostSchema = z.object({
  body: z.string().optional(),
  media: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
      }),
    )
    .optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
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
    const rateLimitResult = await checkRateLimit(user.id, "create_post")
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 10),
        },
      )
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    // Validate that post has content
    if (!validatedData.body?.trim() && (!validatedData.media || validatedData.media.length === 0)) {
      return NextResponse.json({ error: "Post must have text or media content" }, { status: 400 })
    }

    // Sanitize text content
    const sanitizedBody = validatedData.body ? sanitizeText(validatedData.body) : null

    // Generate post ID for media paths
    const postId = crypto.randomUUID()

    // Handle media uploads
    const mediaUrls: string[] = []
    const mediaTypes: string[] = []
    const uploadUrls: { signedUrl: string; path: string }[] = []

    if (validatedData.media && validatedData.media.length > 0) {
      // Validate media files
      for (const media of validatedData.media) {
        if (!validateMediaFile(media)) {
          return NextResponse.json({ error: `Invalid media file: ${media.name}` }, { status: 400 })
        }
      }

      // Generate signed upload URLs
      for (const media of validatedData.media) {
        const path = generateMediaPath(postId, media.name)
        const signedUpload = await signUpload(path, media.type, media.size)

        uploadUrls.push({
          signedUrl: signedUpload.signedUrl,
          path: signedUpload.path,
        })

        mediaUrls.push(signedUpload.path)
        const mediaType = getMediaType(media.type)
        if (mediaType) {
          mediaTypes.push(mediaType)
        }
      }
    }

    // Create post in database
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        id: postId,
        author_id: user.id,
        body: sanitizedBody,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        visibility: validatedData.visibility,
      })
      .select(`
        *,
        author:user_profiles(id, display_name, avatar_url)
      `)
      .single()

    if (postError) {
      console.error("Error creating post:", postError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    // Return post with upload URLs if media present
    const response = {
      post: {
        ...post,
        viewerHasLiked: false,
        viewerBookmarked: false,
      },
      uploadUrls: uploadUrls.length > 0 ? uploadUrls : undefined,
    }

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(rateLimitResult.remaining - 1, rateLimitResult.resetTime, 10),
    })
  } catch (error) {
    console.error("Error in POST /api/samvaaha/posts:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
