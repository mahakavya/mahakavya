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
    const { title, description, category, goalAmount } = body

    // AI content optimization logic (simplified)
    const optimizedContent = await optimizeContent({
      title,
      description,
      category,
      goalAmount: Number.parseInt(goalAmount),
    })

    // Store AI optimization record
    await supabase.from("ai_recommendations").insert({
      user_id: session.user.id,
      recommendation_type: "content_optimization",
      recommended_plan: "campaign_content",
      confidence: optimizedContent.confidence,
      reasoning: optimizedContent.reasoning,
    })

    return NextResponse.json({
      success: true,
      optimizedTitle: optimizedContent.title,
      optimizedDescription: optimizedContent.description,
      suggestedTags: optimizedContent.tags,
      confidence: optimizedContent.confidence,
      improvements: optimizedContent.improvements,
    })
  } catch (error) {
    console.error("AI content optimization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function optimizeContent(data: any) {
  // Simulate AI content optimization
  const { title, description, category, goalAmount } = data

  // Title optimization
  let optimizedTitle = title
  if (title.length < 20) {
    optimizedTitle = `${title} - Help Us Make a Difference`
  }
  if (!title.includes(category.toLowerCase()) && category !== "Other") {
    optimizedTitle = `${category}: ${optimizedTitle}`
  }

  // Description optimization
  let optimizedDescription = description
  if (!description.includes("help") && !description.includes("support")) {
    optimizedDescription = `Help us ${description.toLowerCase()}`
  }
  if (!description.includes("donate") && !description.includes("contribution")) {
    optimizedDescription +=
      "\n\nYour donation, no matter how small, will make a significant impact. Every contribution brings us closer to our goal."
  }

  // Generate relevant tags
  const suggestedTags = generateTags(category, title, description)

  // Calculate confidence based on improvements made
  let confidence = 0.7 // base confidence
  const improvements = []

  if (optimizedTitle !== title) {
    confidence += 0.1
    improvements.push("Enhanced title for better visibility")
  }
  if (optimizedDescription !== description) {
    confidence += 0.1
    improvements.push("Improved description with call-to-action")
  }
  if (suggestedTags.length > 0) {
    confidence += 0.1
    improvements.push("Added relevant tags for better discoverability")
  }

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    tags: suggestedTags,
    confidence: Math.min(confidence, 1.0),
    improvements,
    reasoning: improvements.join("; "),
  }
}

function generateTags(category: string, title: string, description: string): string[] {
  const tags = []
  const text = `${title} ${description}`.toLowerCase()

  // Category-based tags
  const categoryTags: Record<string, string[]> = {
    "Medical Emergency": ["medical", "emergency", "healthcare", "treatment"],
    Education: ["education", "learning", "school", "scholarship"],
    "Disaster Relief": ["disaster", "relief", "emergency", "aid"],
    "Community Development": ["community", "development", "social", "welfare"],
    "Animal Welfare": ["animals", "pets", "rescue", "welfare"],
    Environmental: ["environment", "green", "sustainability", "nature"],
    "Sports & Recreation": ["sports", "recreation", "fitness", "athletics"],
    "Arts & Culture": ["arts", "culture", "creative", "artistic"],
    Technology: ["technology", "innovation", "digital", "tech"],
  }

  if (categoryTags[category]) {
    tags.push(...categoryTags[category])
  }

  // Content-based tags
  if (text.includes("child") || text.includes("children")) tags.push("children")
  if (text.includes("urgent") || text.includes("emergency")) tags.push("urgent")
  if (text.includes("family")) tags.push("family")
  if (text.includes("help")) tags.push("help")
  if (text.includes("support")) tags.push("support")

  // Remove duplicates and limit to 5 tags
  return [...new Set(tags)].slice(0, 5)
}
