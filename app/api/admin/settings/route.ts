import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get current user and verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin" && profile?.role !== "master_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get platform settings
    const { data: settings, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    // Default settings if none exist
    const defaultSettings = {
      general: {
        platformName: "Mahakavya",
        description: "A revolutionary social platform bridging Sanskrit heritage with modern technology",
        maintenanceMode: false,
        registrationEnabled: true,
        maxUsersPerDay: 1000,
        defaultLanguage: "en",
        timezone: "Asia/Kolkata",
      },
      ai: {
        enabled: true,
        provider: "openai",
        apiKey: "",
        model: "gpt-4",
        maxTokens: 500,
        temperature: 0.7,
        contentModerationEnabled: true,
        autoTranslationEnabled: false,
        sentimentAnalysisEnabled: true,
      },
      blockchain: {
        enabled: false,
        network: "ethereum",
        contractAddress: "",
        privateKey: "",
        gasLimit: 21000,
        verificationEnabled: false,
        auditTrailEnabled: false,
      },
      rpa: {
        enabled: true,
        maxConcurrentJobs: 5,
        jobTimeout: 30,
        retryAttempts: 3,
        schedulerEnabled: true,
        monitoringEnabled: true,
      },
      security: {
        twoFactorRequired: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        encryptionEnabled: true,
        auditLogsEnabled: true,
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        webhookUrl: "",
        slackWebhook: "",
      },
      performance: {
        cacheEnabled: true,
        cacheTtl: 3600,
        rateLimitEnabled: true,
        maxRequestsPerMinute: 100,
        compressionEnabled: true,
      },
    }

    return NextResponse.json({
      settings: settings?.settings || defaultSettings,
    })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user and verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin" && profile?.role !== "master_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { settings } = await request.json()

    // Sanitize sensitive data before storing
    const sanitizedSettings = { ...settings }
    if (sanitizedSettings.ai?.apiKey) {
      sanitizedSettings.ai.apiKey = sanitizedSettings.ai.apiKey.substring(0, 8) + "..."
    }
    if (sanitizedSettings.blockchain?.privateKey) {
      sanitizedSettings.blockchain.privateKey = sanitizedSettings.blockchain.privateKey.substring(0, 8) + "..."
    }

    // Update or insert settings
    const { error } = await supabase.from("platform_settings").upsert({
      settings: sanitizedSettings,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    // Log the change
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "update_platform_settings",
      details: { categories: Object.keys(settings) },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
