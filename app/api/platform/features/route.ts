import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Get feature statistics from database
    const { data: featuresData, error } = await supabase
      .from("platform_features")
      .select("*")
      .order("priority", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      // Return mock data if database query fails
      return NextResponse.json({ features: getMockFeatures() })
    }

    // Transform database data to match frontend interface
    const features =
      featuresData?.map((feature) => ({
        name: feature.name,
        status: feature.status,
        users: feature.active_users || 0,
        description: feature.description,
        icon: feature.icon_name,
        category: feature.category,
        aiPowered: feature.ai_powered,
        blockchainSecured: feature.blockchain_secured,
        rpaAutomated: feature.rpa_automated,
      })) || getMockFeatures()

    return NextResponse.json({ features })
  } catch (error) {
    console.error("Platform features API error:", error)
    return NextResponse.json({ features: getMockFeatures() })
  }
}

function getMockFeatures() {
  return [
    {
      name: "Samvaaha",
      status: "live",
      users: 8500,
      description: "AI-curated social feed with meaningful connections and personalized content recommendations",
      icon: "Globe",
      category: "social",
      aiPowered: true,
      blockchainSecured: true,
      rpaAutomated: true,
    },
    {
      name: "Drishya",
      status: "live",
      users: 6200,
      description: "Short-form videos with AI content analysis, automated moderation, and engagement optimization",
      icon: "Video",
      category: "entertainment",
      aiPowered: true,
      blockchainSecured: false,
      rpaAutomated: true,
    },
    {
      name: "Nivedana",
      status: "live",
      users: 3400,
      description: "Blockchain-secured fundraising campaigns with transparent tracking and automated compliance",
      icon: "Heart",
      category: "finance",
      aiPowered: true,
      blockchainSecured: true,
      rpaAutomated: true,
    },
    {
      name: "Sahaya",
      status: "beta",
      users: 1800,
      description: "AI-assisted wellness and mental health support with professional listener network",
      icon: "Headphones",
      category: "wellness",
      aiPowered: true,
      blockchainSecured: false,
      rpaAutomated: true,
    },
    {
      name: "BhagyaChakra",
      status: "live",
      users: 4500,
      description: "Gamified rewards system with blockchain transparency and automated prize distribution",
      icon: "Gift",
      category: "entertainment",
      aiPowered: false,
      blockchainSecured: true,
      rpaAutomated: true,
    },
    {
      name: "Varta",
      status: "coming-soon",
      users: 0,
      description: "End-to-end encrypted messaging platform with AI-powered translation and smart replies",
      icon: "MessageCircle",
      category: "social",
      aiPowered: true,
      blockchainSecured: true,
      rpaAutomated: false,
    },
  ]
}
