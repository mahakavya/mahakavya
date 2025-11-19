import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { campaignData } = body

    // Create RPA automation tasks
    const automationTasks = generateAutomationTasks(campaignData)

    // Store RPA tasks
    for (const task of automationTasks) {
      await supabase.from("rpa_tasks").insert({
        user_id: session.user.id,
        task_type: task.type,
        plan_id: "campaign_creation",
        status: "scheduled",
        scheduled_at: new Date().toISOString(),
      })
    }

    // Store RPA analysis
    await supabase.from("rpa_analyses").insert({
      user_id: session.user.id,
      analysis_type: "campaign_setup",
      plan_id: "campaign_creation",
      insights: automationTasks.map((t) => t.description).join("; "),
      automation_tasks: automationTasks.map((t) => t.type),
      preferences: {
        autoOptimize: true,
        socialSharing: true,
        donorEngagement: true,
        performanceTracking: true,
      },
    })

    return NextResponse.json({
      success: true,
      automationTasks: automationTasks.length,
      scheduledTasks: automationTasks.map((t) => t.type),
    })
  } catch (error) {
    console.error("RPA setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateAutomationTasks(campaignData: any) {
  const tasks = []

  // Content optimization task
  tasks.push({
    type: "content_optimization",
    description: "Continuously optimize campaign content based on performance",
    priority: "high",
  })

  // Social media automation
  tasks.push({
    type: "social_sharing",
    description: "Automated social media posting and sharing",
    priority: "medium",
  })

  // Donor engagement
  tasks.push({
    type: "donor_engagement",
    description: "Automated thank you messages and updates to donors",
    priority: "high",
  })

  // Performance monitoring
  tasks.push({
    type: "performance_monitoring",
    description: "Real-time campaign performance tracking and alerts",
    priority: "medium",
  })

  // Goal-based tasks
  if (Number.parseInt(campaignData.goalAmount) > 100000) {
    tasks.push({
      type: "high_value_outreach",
      description: "Targeted outreach for high-value donations",
      priority: "high",
    })
  }

  // Category-specific tasks
  if (campaignData.category === "Medical Emergency") {
    tasks.push({
      type: "medical_verification",
      description: "Automated medical document verification reminders",
      priority: "high",
    })
  }

  return tasks
}
