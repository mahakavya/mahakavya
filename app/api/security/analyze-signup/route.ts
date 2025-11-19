import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, userData } = await request.json()

    // Check if we have AI service configuration
    const hasAIService = process.env.AI_SERVICE_URL || process.env.OPENAI_API_KEY

    if (!hasAIService) {
      console.warn("Security analysis: AI service not configured")
      return NextResponse.json({
        success: true,
        aiVerified: false,
        threatLevel: "low",
        riskScore: 10,
        passwordStrength: password ? Math.min(password.length * 10, 100) : 0,
        recommendations: ["Use a longer password", "Include special characters", "Add numbers"],
        emailValidation: {
          isValid: email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false,
          suggestions: email ? [] : ["Please enter a valid email address"],
        },
        status: "ai_unavailable",
        message: "Basic security check completed (AI analysis unavailable)",
      })
    }

    // Perform basic security analysis without AI
    const passwordStrength = password ? Math.min(password.length * 10, 100) : 0
    const hasSpecialChars = password ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : false
    const hasNumbers = password ? /\d/.test(password) : false
    const hasUpperCase = password ? /[A-Z]/.test(password) : false
    const hasLowerCase = password ? /[a-z]/.test(password) : false

    const recommendations = []
    if (password && password.length < 12) recommendations.push("Use a longer password (12+ characters)")
    if (!hasSpecialChars) recommendations.push("Include special characters")
    if (!hasNumbers) recommendations.push("Add numbers")
    if (!hasUpperCase) recommendations.push("Include uppercase letters")
    if (!hasLowerCase) recommendations.push("Include lowercase letters")

    const riskScore = Math.max(0, 100 - passwordStrength - (hasSpecialChars ? 20 : 0) - (hasNumbers ? 10 : 0))
    const threatLevel = riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low"

    return NextResponse.json({
      success: true,
      aiVerified: false,
      threatLevel,
      riskScore,
      passwordStrength,
      recommendations,
      emailValidation: {
        isValid: email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false,
        suggestions: email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? ["Please enter a valid email address"] : [],
      },
      status: "basic_analysis",
      message: "Basic security analysis completed",
    })
  } catch (error) {
    console.error("Security analysis error:", error)

    return NextResponse.json({
      success: true,
      aiVerified: false,
      threatLevel: "low",
      riskScore: 20,
      passwordStrength: 50,
      recommendations: ["Use a strong password"],
      emailValidation: {
        isValid: true,
        suggestions: [],
      },
      status: "analysis_failed",
      message: "Security analysis failed, using default safe values",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
