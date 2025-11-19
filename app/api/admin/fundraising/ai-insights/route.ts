import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("content_type", "fundraising_campaign")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch AI insights" }, { status: 500 })
    }

    const insights =
      data?.map((insight: any) => ({
        id: insight.id,
        campaignId: insight.content_id,
        type: insight.insight_type,
        confidence: insight.confidence,
        findings: insight.findings || [],
        recommendations: insight.recommendations || [],
        severity: insight.severity,
        createdAt: insight.created_at,
      })) || []

    return NextResponse.json({ success: true, data: insights })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
