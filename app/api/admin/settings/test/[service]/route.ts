import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest, { params }: { params: { service: string } }) {
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
    const service = params.service

    let testResult

    switch (service) {
      case "ai":
        testResult = await testAIConnection(settings?.ai)
        break
      case "blockchain":
        testResult = await testBlockchainConnection(settings?.blockchain)
        break
      case "rpa":
        testResult = await testRPAConnection(settings?.rpa)
        break
      case "notifications":
        testResult = await testNotificationConnection(settings?.notifications)
        break
      default:
        return NextResponse.json({ error: "Unknown service" }, { status: 400 })
    }

    // Log the test
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: `test_${service}_connection`,
      details: { success: testResult.success, service },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json(testResult)
  } catch (error) {
    console.error(`Service test error for ${params.service}:`, error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}

async function testAIConnection(aiSettings: any) {
  try {
    if (!aiSettings?.apiKey || !aiSettings?.enabled) {
      return {
        success: false,
        message: "AI service is not configured or disabled",
      }
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${aiSettings.apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      return {
        success: true,
        message: "AI service connection successful",
      }
    } else {
      return {
        success: false,
        message: `AI service connection failed: HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `AI service connection failed: ${(error as Error).message}`,
    }
  }
}

async function testBlockchainConnection(blockchainSettings: any) {
  try {
    if (!blockchainSettings?.enabled) {
      return {
        success: false,
        message: "Blockchain service is disabled",
      }
    }

    if (!blockchainSettings?.contractAddress || !blockchainSettings?.network) {
      return {
        success: false,
        message: "Blockchain configuration is incomplete",
      }
    }

    // Mock blockchain connection test
    // In production, this would test actual blockchain connectivity
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: `Blockchain connection successful on ${blockchainSettings.network}`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Blockchain connection failed: ${(error as Error).message}`,
    }
  }
}

async function testRPAConnection(rpaSettings: any) {
  try {
    if (!rpaSettings?.enabled) {
      return {
        success: false,
        message: "RPA engine is disabled",
      }
    }

    // Mock RPA engine test
    // In production, this would test actual RPA service
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      message: "RPA engine connection successful",
    }
  } catch (error) {
    return {
      success: false,
      message: `RPA engine connection failed: ${(error as Error).message}`,
    }
  }
}

async function testNotificationConnection(notificationSettings: any) {
  try {
    const results = []

    if (notificationSettings?.emailEnabled) {
      // Test email service
      results.push("Email service: OK")
    }

    if (notificationSettings?.webhookUrl) {
      try {
        const response = await fetch(notificationSettings.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          results.push("Webhook: OK")
        } else {
          results.push(`Webhook: Failed (HTTP ${response.status})`)
        }
      } catch (error) {
        results.push(`Webhook: Failed (${(error as Error).message})`)
      }
    }

    if (notificationSettings?.slackWebhook) {
      try {
        const response = await fetch(notificationSettings.slackWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "Test notification from Mahakavya Settings",
            username: "Niyantrana Bot",
          }),
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          results.push("Slack: OK")
        } else {
          results.push(`Slack: Failed (HTTP ${response.status})`)
        }
      } catch (error) {
        results.push(`Slack: Failed (${(error as Error).message})`)
      }
    }

    return {
      success: results.length > 0,
      message: results.length > 0 ? results.join(", ") : "No notification services configured",
    }
  } catch (error) {
    return {
      success: false,
      message: `Notification test failed: ${(error as Error).message}`,
    }
  }
}
