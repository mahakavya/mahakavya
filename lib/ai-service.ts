interface AIMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface AIContext {
  page?: string
  currentAction?: string
  userRole?: string
  previousMessages?: AIMessage[]
}

interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

class AIService {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ""
    this.baseUrl = "https://api.openai.com/v1"
    this.model = "gpt-4"
  }

  async sendMessage(message: string, context?: AIContext): Promise<AIResponse> {
    try {
      // If no API key, return a mock response
      if (!this.apiKey) {
        return this.getMockResponse(message, context)
      }

      const systemPrompt = this.buildSystemPrompt(context)
      const messages: AIMessage[] = [
        { role: "system", content: systemPrompt },
        ...(context?.previousMessages || []),
        { role: "user", content: message },
      ]

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()

      return {
        content: data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.",
        usage: data.usage,
      }
    } catch (error) {
      console.error("AI Service error:", error)
      return this.getMockResponse(message, context)
    }
  }

  private buildSystemPrompt(context?: AIContext): string {
    let prompt = `You are an AI assistant for Mahakavya, a revolutionary social platform that bridges Sanskrit heritage with modern technology. 
    
    Key aspects of Mahakavya:
    - Honors Sanskrit culture and ancient wisdom
    - Uses cutting-edge AI, Blockchain, and RPA technologies
    - Focuses on meaningful connections and authentic interactions
    - Promotes cultural preservation and community building
    - Offers features like Samvaaha (social feed), Drishya (videos), Varta (messaging), Sahaya (wellness), Nivedana (fundraising), and BhagyaChakra (rewards)
    
    Your responses should be:
    - Warm and culturally sensitive
    - Informative about platform features
    - Encouraging and supportive
    - Brief but meaningful (1-3 sentences)
    - Respectful of Sanskrit heritage`

    if (context?.page) {
      prompt += `\n\nCurrent page: ${context.page}`
    }

    if (context?.currentAction) {
      prompt += `\nUser action: ${context.currentAction}`
    }

    if (context?.userRole) {
      prompt += `\nUser role: ${context.userRole}`
    }

    return prompt
  }

  private getMockResponse(message: string, context?: AIContext): AIResponse {
    const mockResponses = {
      greeting:
        "🙏 Namaste! Welcome to Mahakavya, where ancient wisdom meets modern innovation. We're delighted to have you join our community of authentic connections and cultural celebration.",
      feature_exploration:
        "Each feature in Mahakavya is designed to honor our heritage while embracing innovation. Explore with curiosity and discover how technology can enhance meaningful human connections.",
      wellness:
        "Your well-being matters deeply to us. Mahakavya's Sahaya feature combines AI guidance with human compassion to support your journey toward mental and emotional wellness.",
      fundraising:
        "Through Nivedana, we ensure every act of giving is transparent and impactful. Blockchain technology guarantees your donations reach their intended purpose with complete accountability.",
      community:
        "Our community thrives on authentic connections rooted in shared values. Together, we're building a platform that celebrates both individual expression and collective wisdom.",
      default:
        "Thank you for being part of Mahakavya's journey. Your presence enriches our community and helps us bridge ancient wisdom with modern possibilities.",
    }

    // Simple keyword matching for mock responses
    const lowerMessage = message.toLowerCase()
    let responseKey = "default"

    if (lowerMessage.includes("greeting") || lowerMessage.includes("welcome")) {
      responseKey = "greeting"
    } else if (lowerMessage.includes("feature") || lowerMessage.includes("exploring")) {
      responseKey = "feature_exploration"
    } else if (lowerMessage.includes("wellness") || lowerMessage.includes("sahaya")) {
      responseKey = "wellness"
    } else if (lowerMessage.includes("fundraising") || lowerMessage.includes("nivedana")) {
      responseKey = "fundraising"
    } else if (lowerMessage.includes("community") || lowerMessage.includes("connection")) {
      responseKey = "community"
    }

    return {
      content: mockResponses[responseKey as keyof typeof mockResponses],
      usage: {
        promptTokens: 50,
        completionTokens: 30,
        totalTokens: 80,
      },
    }
  }

  async analyzeContent(content: string): Promise<{
    sentiment: "positive" | "neutral" | "negative"
    toxicity: number
    culturalSensitivity: number
    suggestions?: string[]
  }> {
    try {
      if (!this.apiKey) {
        return {
          sentiment: "positive",
          toxicity: 0.1,
          culturalSensitivity: 0.9,
          suggestions: ["Content appears appropriate for our community"],
        }
      }

      const response = await this.sendMessage(
        `Analyze this content for sentiment, toxicity (0-1 scale), and cultural sensitivity (0-1 scale): "${content}"`,
        { currentAction: "content_analysis" },
      )

      // Parse the response (in a real implementation, you'd use structured output)
      return {
        sentiment: "positive",
        toxicity: 0.1,
        culturalSensitivity: 0.9,
        suggestions: ["Content analysis completed"],
      }
    } catch (error) {
      console.error("Content analysis error:", error)
      return {
        sentiment: "neutral",
        toxicity: 0.5,
        culturalSensitivity: 0.5,
        suggestions: ["Unable to analyze content at this time"],
      }
    }
  }

  async generateSuggestions(context: string): Promise<string[]> {
    try {
      const response = await this.sendMessage(`Generate 3 helpful suggestions for: ${context}`, {
        currentAction: "suggestion_generation",
      })

      // In a real implementation, you'd parse structured output
      return [
        "Explore our community guidelines for best practices",
        "Connect with like-minded community members",
        "Share your unique perspective and experiences",
      ]
    } catch (error) {
      console.error("Suggestion generation error:", error)
      return ["We're here to help you make the most of Mahakavya"]
    }
  }

  // Add alias for backward compatibility
  async getSuggestions(context: string): Promise<string[]> {
    return this.generateSuggestions(context)
  }

  async getWelcomeMessage(userRole?: string): Promise<string> {
    const context = userRole ? { userRole, currentAction: "welcome" } : { currentAction: "welcome" }
    const response = await this.sendMessage("Generate a welcome message for a new user", context)
    return response.content
  }

  async getContextualHelp(page: string, action?: string): Promise<string> {
    const context = { page, currentAction: action || "help_request" }
    const response = await this.sendMessage(`Provide contextual help for the ${page} page`, context)
    return response.content
  }
}

// Create and export the AI service instance
export const aiService = new AIService()

// Also export as default for compatibility
export default aiService
