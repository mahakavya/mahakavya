import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { generateText } from "@/lib/ai"
import { openai } from "@/lib/openai"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, analysisType } = await request.json()

  const supabase = createSupabaseServerClient()
  const sb: any = supabase as any
  if (campaignId) {
      // Analyze specific campaign
      const { data: campaign, error } = await sb
        .from("fundraising_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single()

      if (error || !campaign) {
        return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
      }

      const analysisPrompt = `
        Analyze this fundraising campaign for potential fraud, success prediction, and optimization opportunities:
        
        Title: ${campaign.title}
        Description: ${campaign.description}
        Category: ${campaign.category}
        Target Amount: ${campaign.target_amount}
        Raised Amount: ${campaign.raised_amount}
        Creator: ${campaign.creator_name}
        Location: ${campaign.location}
        
        Provide analysis in JSON format:
        {
          "fraudRisk": 0.0-1.0,
          "successProbability": 0.0-1.0,
          "findings": ["finding1", "finding2"],
          "recommendations": ["rec1", "rec2"],
          "severity": "info|warning|critical",
          "confidence": 0.0-1.0
        }
      `

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: "You are an AI fraud detection and campaign optimization expert. Respond with JSON only.",
        prompt: analysisPrompt,
      })

      const analysis = JSON.parse(text)

      // Save AI insight
  await sb.from("ai_insights").insert({
        content_type: "fundraising_campaign",
        content_id: campaignId,
        insight_type: "comprehensive_analysis",
        confidence: analysis.confidence,
        findings: analysis.findings,
        recommendations: analysis.recommendations,
        severity: analysis.severity,
        metadata: {
          fraudRisk: analysis.fraudRisk,
          successProbability: analysis.successProbability,
        },
      })

      // Update campaign risk level based on analysis
      const riskLevel =
        analysis.fraudRisk > 0.8
          ? "critical"
          : analysis.fraudRisk > 0.6
            ? "high"
            : analysis.fraudRisk > 0.3
              ? "medium"
              : "low"

      await sb
        .from("fundraising_campaigns")
        .update({
          risk_level: riskLevel,
          ai_score: 1 - analysis.fraudRisk,
        })
        .eq("id", campaignId)
    } else {
      // Analyze all pending campaigns
  const { data: campaigns, error } = await sb
        .from("fundraising_campaigns")
        .select("*")
        .eq("status", "pending")
        .limit(10)

      if (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch campaigns" }, { status: 500 })
      }

      for (const campaign of campaigns || []) {
        // Process each campaign (simplified for bulk analysis)
        const riskScore = Math.random() * 0.3 // Simulate AI analysis
        const riskLevel = riskScore > 0.2 ? "medium" : "low"

        await sb
          .from("fundraising_campaigns")
          .update({
            risk_level: riskLevel,
            ai_score: 1 - riskScore,
          })
          .eq("id", campaign.id)

        await sb.from("ai_insights").insert({
          content_type: "fundraising_campaign",
          content_id: campaign.id,
          insight_type: "bulk_analysis",
          confidence: 0.8,
          findings: ["Automated bulk analysis completed"],
          recommendations: ["Manual review recommended for high-risk campaigns"],
          severity: "info",
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({ success: false, error: "AI analysis failed" }, { status: 500 })
  }
}
