import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Get campaign statistics
    const { data: statsData, error: statsError } = await supabase.rpc("get_fundraising_stats")

    if (statsError) {
      console.error("Stats error:", statsError)
      return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
    }

    const stats = {
      total: statsData?.total_campaigns || 0,
      pending: statsData?.pending_campaigns || 0,
      active: statsData?.active_campaigns || 0,
      completed: statsData?.completed_campaigns || 0,
      rejected: statsData?.rejected_campaigns || 0,
      flagged: statsData?.flagged_campaigns || 0,
      totalRaised: statsData?.total_raised || 0,
      averageAmount: statsData?.average_amount || 0,
      successRate: statsData?.success_rate || 0,
      processingTime: statsData?.avg_processing_time || 0,
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
