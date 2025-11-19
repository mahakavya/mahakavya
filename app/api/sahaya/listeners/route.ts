import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ListenerCreateSchema, ListenerQuerySchema } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const queryData = {
      specialization: searchParams.get("q") || searchParams.get("specialization"),
      language: searchParams.get("language"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    }

    const validatedQuery = ListenerQuerySchema.parse(queryData) as any
    const offset = (validatedQuery.page - 1) * validatedQuery.limit

    // Build query
    let query = supabase
      .from("listeners")
      .select(`
        user_id,
        bio,
        expertise,
        rating,
        is_active,
        profiles!listeners_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq("is_active", true)
      .range(offset, offset + validatedQuery.limit - 1)

    // Apply search filter using specialization/language
    if (validatedQuery.specialization) {
      const q = validatedQuery.specialization as string
      query = query.or(`bio.ilike.%${q}%,specializations.cs.{${q}}`)
    }

    // Apply specialization filter (comma separated)
    if (validatedQuery.specialization && validatedQuery.specialization.includes(",")) {
      const expertiseList = (validatedQuery.specialization as string).split(",").map((e: string) => e.trim())
      query = query.overlaps("specializations", expertiseList)
    }

    const { data: listeners, error } = await query

    if (error) {
      console.error("Error fetching listeners:", error)
      return NextResponse.json({ error: "Failed to fetch listeners" }, { status: 500 })
    }

    // Transform data
    const transformedListeners = listeners.map((listener: any) => ({
      id: listener.user_id,
      name: listener.profiles?.name || "Anonymous",
      avatar_url: listener.profiles?.avatar_url,
      bio: listener.bio,
      expertise: listener.expertise,
      rating: listener.rating,
      is_active: listener.is_active,
    }))

    return NextResponse.json({ listeners: transformedListeners })
  } catch (error) {
    console.error("Listeners GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  const body = await request.json()
  const validatedData = ListenerCreateSchema.parse(body) as any

    // Upsert listener profile
    const { data: listener, error: listenerError } = await supabase
      .from("listeners")
      .upsert(
        {
          user_id: session.user.id,
          bio: validatedData.bio,
          // validators use `specializations` but older code expects `expertise` — accept either
          expertise: validatedData.expertise ?? validatedData.specializations ?? [],
          is_active: true,
          rating: 5.0, // Default rating
        },
        { onConflict: "user_id" },
      )
      .select()
      .single()

    if (listenerError) {
      console.error("Error creating listener:", listenerError)
      return NextResponse.json({ error: "Failed to create listener profile" }, { status: 500 })
    }

    return NextResponse.json({ listener }, { status: 201 })
  } catch (error) {
    console.error("Listeners POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
