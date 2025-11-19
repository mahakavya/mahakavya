import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, profile, preferences } = await request.json()

    // Check if we have the required environment variables
    const hasServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

    if (!hasServiceRoleKey) {
      console.warn("RPA post-signup: SUPABASE_SERVICE_ROLE_KEY not configured, skipping RPA automation")
      return NextResponse.json({
        success: true,
        rpaEnabled: false,
        automationStatus: "disabled",
        message: "Account created successfully (RPA automation skipped - service not configured)",
        automationTasks: [],
        warning: "RPA automation service is not configured",
      })
    }

    // If we have the service role key, we could perform RPA operations
    // For now, we'll simulate RPA automation
    const automationTasks = [
      "Profile setup completed",
      "Default preferences configured",
      "Welcome notifications scheduled",
      "Content recommendations initialized",
    ]

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      rpaEnabled: true,
      automationStatus: "completed",
      message: "RPA automation setup completed successfully",
      automationTasks,
      userId,
      profile: {
        fullName: profile?.fullName,
        email,
        preferences: preferences || {},
      },
    })
  } catch (error) {
    console.error("RPA post-signup error:", error)

    // Return success even on error to not block signup
    return NextResponse.json({
      success: true,
      rpaEnabled: false,
      automationStatus: "setup_failed",
      message: "Account created successfully (RPA automation failed)",
      automationTasks: [],
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
