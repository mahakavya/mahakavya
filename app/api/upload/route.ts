import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { monitoring } from "@/lib/monitoring"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall("/api/upload", "POST", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      monitoring.logApiCall("/api/upload", "POST", Date.now() - startTime, 400, session.user.id)
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      monitoring.logApiCall("/api/upload", "POST", Date.now() - startTime, 400, session.user.id)
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > maxSize) {
      monitoring.logApiCall("/api/upload", "POST", Date.now() - startTime, 400, session.user.id)
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    const filename = `${session.user.id}/${timestamp}_${randomString}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("media").upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      monitoring.logError(
        new Error(`Upload failed: ${error.message}`),
        { filename, fileSize: file.size },
        session.user.id,
      )
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(data.path)

    monitoring.logApiCall("/api/upload", "POST", Date.now() - startTime, 200, session.user.id)
    monitoring.logUserAction(
      "file_uploaded",
      {
        filename,
        fileSize: file.size,
        fileType: file.type,
        uploadTime: Date.now() - startTime,
      },
      session.user.id,
    )

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: "/api/upload" })
    monitoring.logApiCall("/api/upload", "POST", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
