import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user settings
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", profile.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings = {
      id: profile.id,
      theme: "system" as const,
      language: "en",
      timezone: "Asia/Kolkata",
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
        security: true,
        social: true,
      },
      privacy: {
        profileVisibility: "public" as const,
        showEmail: false,
        showPhone: false,
        allowMessages: true,
        allowFriendRequests: true,
        dataCollection: true,
        analytics: true,
      },
      preferences: {
        autoPlay: true,
        highContrast: false,
        reducedMotion: false,
        compactMode: false,
        showTips: true,
        aiSuggestions: true,
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        loginAlerts: true,
        deviceTracking: true,
      },
      ai: {
        personalizedContent: true,
        smartNotifications: true,
        contentModeration: true,
        languageProcessing: true,
        behaviorAnalysis: true,
      },
      blockchain: {
        profileVerification: false,
        contentSigning: false,
        privacyMode: false,
        auditTrail: true,
      },
      rpa: {
        autoOptimization: true,
        smartScheduling: false,
        performanceMonitoring: true,
        securityScanning: true,
      },
    }

    return NextResponse.json({
      settings: settings ? { ...defaultSettings, ...settings.settings } : defaultSettings,
    })
  } catch (error) {
    console.error("Error in settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()

    // Validate settings structure
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 })
    }

    // Upsert user settings
    const { error } = await supabase.from("user_settings").upsert({
      user_id: profile.id,
      settings: settings,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving settings:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    // Log the settings change for audit
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "settings_updated",
      entity: "user_settings",
      entity_id: profile.id,
      metadata: { settingsKeys: Object.keys(settings) },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in settings PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
