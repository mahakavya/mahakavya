import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { user_id, preferences } = await request.json()

    // AI-powered recommendation logic
    let recommendedPlan = "monthly" // Default
    let confidence = 0.75
    let reasoning = ["Based on your preferences"]
    let savingsPotential = 0

    // Analyze user preferences
    if (preferences.budget_range === "premium") {
      recommendedPlan = "annual"
      confidence = 0.92
      reasoning = [
        "Your premium budget preference aligns with annual plan benefits",
        "Annual plan offers best value with 2 months free",
        "Premium features match your usage pattern",
      ]
      savingsPotential = 58800 // 2 months savings in paise
    } else if (preferences.budget_range === "budget") {
      recommendedPlan = "intro"
      confidence = 0.88
      reasoning = [
        "Budget-friendly one-time payment suits your preference",
        "Perfect starting point for new users",
        "Includes all essential features",
      ]
    } else {
      // Regular budget - recommend monthly
      confidence = 0.85
      reasoning = [
        "Monthly plan offers perfect balance of features and cost",
        "Most popular choice among users with similar preferences",
        "Flexible commitment with premium features",
      ]
    }

    // Adjust based on feature priorities
    if (preferences.features_priority.includes("advanced_ai")) {
      if (recommendedPlan === "intro") {
        recommendedPlan = "monthly"
        reasoning.push("Advanced AI features require monthly or annual subscription")
      }
    }

    // Adjust based on usage pattern
    if (preferences.usage_pattern === "heavy" && recommendedPlan !== "annual") {
      recommendedPlan = "annual"
      confidence = Math.min(confidence + 0.1, 0.95)
      reasoning.push("Heavy usage pattern benefits from annual plan savings")
      savingsPotential = 58800
    }

    const recommendation = {
      recommended_plan: recommendedPlan,
      confidence,
      reasoning,
      savings_potential: savingsPotential,
    }

    // Log AI recommendation for analytics
    const supabase = await createSupabaseServerClient()
    await supabase
      .from("ai_recommendations")
      .insert({
        user_id,
        recommendation_type: "subscription_plan",
        recommended_plan: recommendedPlan,
        confidence,
        reasoning: reasoning.join(". "),
        created_at: new Date().toISOString(),
      })
      .catch(() => {}) // Ignore errors for logging

    return NextResponse.json({ recommendation })
  } catch (error) {
    console.error("AI recommendation API error:", error)

    // Return default recommendation
    const defaultRecommendation = {
      recommended_plan: "monthly",
      confidence: 0.75,
      reasoning: ["Most popular plan among users", "Great balance of features and value"],
      savings_potential: 0,
    }

    return NextResponse.json({ recommendation: defaultRecommendation })
  }
}
