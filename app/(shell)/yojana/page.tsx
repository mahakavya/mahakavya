"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Star, Sparkles, Shield, Zap, Crown, ArrowRight, Loader2, Bot, Lock, Cog } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatINR } from "@/lib/money"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

// Enhanced plan definitions with new pricing structure
const ENHANCED_PLANS = [
  {
    id: "intro",
    name: "Prarambha",
    subtitle: "Perfect Start",
    price: 9900, // ₹99
    originalPrice: 19900, // ₹199
    interval: "one-time",
    popular: false,
    aiRecommended: false,
    color: "from-green-500 to-emerald-600",
    icon: Sparkles,
    features: [
      "Access to Samvaaha (Social Feed)",
      "Create and share Drishya (Video Reels)",
      "Participate in BhagyaChakra (Lucky Draws)",
      "Launch Nivedana (Fundraising Campaigns)",
      "Basic Sahaya (Emotional Support)",
      "Community guidelines and safety",
      "Mobile app access",
      "Email support",
    ],
    aiFeatures: ["AI-powered content recommendations", "Smart hashtag suggestions", "Basic sentiment analysis"],
    blockchainFeatures: ["Verified digital identity", "Secure transaction logging"],
    rpaFeatures: ["Automated profile setup", "Smart notification preferences"],
  },
  {
    id: "monthly",
    name: "Sampurna",
    subtitle: "Introductory Offer",
    price: 9900, // ₹99 (introductory price)
    originalPrice: 49900, // ₹499 (regular price)
    interval: "month",
    popular: true,
    aiRecommended: true,
    color: "from-blue-500 to-indigo-600",
    icon: Crown,
    isIntroOffer: true,
    introOfferDetails: {
      introPrice: 9900, // ₹99
      regularPrice: 49900, // ₹499
      introDuration: "12 months",
      totalSavings: 480000, // ₹4800 (₹400 × 12 months)
    },
    features: [
      "Everything in Prarambha",
      "Unlimited Varta (Private Messaging)",
      "Priority Sahaya sessions",
      "Advanced fundraising tools",
      "Premium video quality",
      "Custom profile themes",
      "Priority customer support",
      "Early access to new features",
      "Advanced analytics dashboard",
      "Export your data anytime",
    ],
    aiFeatures: [
      "Advanced AI content curation",
      "Personalized user matching",
      "Predictive engagement analytics",
      "AI-powered mood detection",
      "Smart campaign optimization",
    ],
    blockchainFeatures: [
      "Enhanced identity verification",
      "Immutable content timestamps",
      "Decentralized reputation system",
      "Secure payment processing",
    ],
    rpaFeatures: [
      "Automated content moderation",
      "Smart scheduling assistant",
      "Intelligent backup systems",
      "Automated compliance checks",
    ],
  },
  {
    id: "annual",
    name: "Mahatva",
    subtitle: "Ultimate Value",
    price: 118800, // ₹1188 (₹99 × 12 months)
    originalPrice: 598800, // ₹5988 (₹499 × 12 months)
    interval: "year",
    popular: false,
    aiRecommended: false,
    color: "from-purple-500 to-pink-600",
    icon: Star,
    isIntroOffer: true,
    introOfferDetails: {
      introPrice: 118800, // ₹1188
      regularPrice: 598800, // ₹5988
      introDuration: "12 months",
      totalSavings: 480000, // ₹4800
    },
    features: [
      "Everything in Sampurna",
      "Full year at introductory price",
      "Exclusive annual member benefits",
      "Priority feature requests",
      "Direct line to development team",
      "Annual member-only events",
      "Advanced API access",
      "White-label options",
      "Custom integrations support",
    ],
    aiFeatures: [
      "Premium AI model access",
      "Custom AI training on your data",
      "Advanced predictive insights",
      "AI-powered business intelligence",
    ],
    blockchainFeatures: [
      "Premium blockchain features",
      "Custom smart contracts",
      "Advanced security protocols",
      "Blockchain analytics dashboard",
    ],
    rpaFeatures: [
      "Custom automation workflows",
      "Advanced integration capabilities",
      "Dedicated automation support",
      "Enterprise-grade RPA tools",
    ],
  },
]

interface UserPreferences {
  interests: string[]
  usage_pattern: string
  budget_range: string
  features_priority: string[]
}

interface AIRecommendation {
  recommended_plan: string
  confidence: number
  reasoning: string[]
  savings_potential: number
}

interface SubscriptionStats {
  total_users: number
  active_subscriptions: number
  popular_plan: string
  satisfaction_rate: number
}

export default function YojanaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null)
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null)
  const [blockchainVerified, setBlockchainVerified] = useState(false)
  const [rpaProcessing, setRpaProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("plans")

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    loadSubscriptionStats()
    initializeBlockchainVerification()
  }, [user])

  useEffect(() => {
    if (userPreferences) {
      generateAIRecommendation()
    }
  }, [userPreferences])

  const loadUserData = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/yojana/user-preferences")
      if (response.ok) {
        const data = await response.json()
        setUserPreferences(data.preferences)
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error)
    }
  }

  const loadSubscriptionStats = async () => {
    try {
      const response = await fetch("/api/yojana/stats")
      if (response.ok) {
        const data = await response.json()
        setSubscriptionStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load subscription stats:", error)
    }
  }

  const initializeBlockchainVerification = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/yojana/blockchain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setBlockchainVerified(data.verified)
      }
    } catch (error) {
      console.error("Blockchain verification failed:", error)
    }
  }

  const generateAIRecommendation = async () => {
    if (!userPreferences || !user) return

    try {
      const response = await fetch("/api/yojana/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          preferences: userPreferences,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiRecommendation(data.recommendation)
      }
    } catch (error) {
      console.error("AI recommendation failed:", error)
    }
  }

  const handlePlanSelection = async (planId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    setSelectedPlan(planId)
    setIsLoading(true)
    setRpaProcessing(true)

    try {
      // RPA: Automated plan analysis and preparation
      const rpaResponse = await fetch("/api/yojana/rpa/analyze-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          plan_id: planId,
          current_preferences: userPreferences,
        }),
      })

      if (rpaResponse.ok) {
        const rpaData = await rpaResponse.json()

        // Show RPA insights
        toast({
          title: "Smart Analysis Complete",
          description: `RPA system analyzed your selection. ${rpaData.insights}`,
        })
      }

      // Proceed with plan selection
      const plan = ENHANCED_PLANS.find((p) => p.id === planId)
      if (!plan) throw new Error("Plan not found")

      if (plan.id === "intro") {
        router.push("/onboarding/pay-intro")
      } else {
        // Create subscription
        const subscribeResponse = await fetch("/api/yojana/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            blockchain_verified: blockchainVerified,
          }),
        })

        if (subscribeResponse.ok) {
          const { subscription_id, payment_url } = await subscribeResponse.json()

          // Blockchain: Log subscription creation
          await fetch("/api/yojana/blockchain/log-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              subscription_id,
              plan_id: planId,
              timestamp: new Date().toISOString(),
            }),
          })

          // Redirect to payment
          window.location.href = payment_url
        } else {
          throw new Error("Failed to create subscription")
        }
      }
    } catch (error) {
      console.error("Plan selection failed:", error)
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setRpaProcessing(false)
      setSelectedPlan(null)
    }
  }

  const getPlanRecommendationBadge = (planId: string) => {
    if (aiRecommendation?.recommended_plan === planId) {
      return (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600">
          <Bot className="h-3 w-3 mr-1" />
          AI Recommended ({Math.round(aiRecommendation.confidence * 100)}%)
        </Badge>
      )
    }
    return null
  }

  const getIntroOfferBadge = (plan: any) => {
    if (plan.isIntroOffer) {
      return (
        <Badge className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-red-500">
          <Sparkles className="h-3 w-3 mr-1" />
          Limited Time Offer
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="space-y-12">
      <PageHeader title="Yojana" subtitle="Choose your perfect plan with AI-powered recommendations" />

      {/* Special Introductory Offer Alert */}
      <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-orange-800">🎉 Limited Time Introductory Offer!</p>
            <p className="text-sm text-orange-700">
              Get full access to Mahakavya for just ₹99/month for your first year. After that, it's ₹499/month. Save
              ₹4,800 in your first year!
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* AI Recommendation Alert */}
      {aiRecommendation && (
        <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <Bot className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                AI Recommendation: {ENHANCED_PLANS.find((p) => p.id === aiRecommendation.recommended_plan)?.name}
              </p>
              <p className="text-sm">{aiRecommendation.reasoning.join(". ")}</p>
              {aiRecommendation.savings_potential > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  Potential savings: {formatINR(aiRecommendation.savings_potential)}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Blockchain & RPA Status */}
      <div className="flex gap-4 justify-center">
        <div className="flex items-center gap-2 text-sm">
          <Shield className={`h-4 w-4 ${blockchainVerified ? "text-green-600" : "text-gray-400"}`} />
          <span>Blockchain {blockchainVerified ? "Verified" : "Pending"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Cog className={`h-4 w-4 ${rpaProcessing ? "animate-spin text-blue-600" : "text-gray-400"}`} />
          <span>RPA {rpaProcessing ? "Processing" : "Ready"}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="features">Feature Comparison</TabsTrigger>
          <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-8">
          {/* Subscription Plans */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {ENHANCED_PLANS.map((plan) => {
              const Icon = plan.icon
              const isRecommended = aiRecommendation?.recommended_plan === plan.id
              const isProcessing = selectedPlan === plan.id && isLoading

              return (
                <Card
                  key={plan.id}
                  className={`glass relative transition-all duration-300 hover:shadow-xl ${
                    plan.popular ? "border-blue-200 shadow-lg scale-105" : ""
                  } ${isRecommended ? "ring-2 ring-purple-500 ring-opacity-50" : ""}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}

                  {getPlanRecommendationBadge(plan.id)}
                  {getIntroOfferBadge(plan)}

                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-gray-600">{plan.subtitle}</p>

                    <div className="text-center mt-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatINR(plan.price)}
                        {plan.interval !== "one-time" && (
                          <span className="text-lg font-normal text-gray-600">/{plan.interval}</span>
                        )}
                      </div>

                      {plan.originalPrice && (
                        <div className="text-sm text-gray-500">
                          <span className="line-through">{formatINR(plan.originalPrice)}</span>
                          <span className="ml-2 text-green-600 font-medium">
                            Save {formatINR(plan.originalPrice - plan.price)}
                          </span>
                        </div>
                      )}

                      {plan.isIntroOffer && plan.introOfferDetails && (
                        <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm font-medium text-orange-800">
                            Introductory Offer: {formatINR(plan.introOfferDetails.introPrice)}/month for{" "}
                            {plan.introOfferDetails.introDuration}
                          </p>
                          <p className="text-xs text-orange-600">
                            Then {formatINR(plan.introOfferDetails.regularPrice)}/month
                          </p>
                          <p className="text-xs text-green-600 font-medium">
                            Total savings: {formatINR(plan.introOfferDetails.totalSavings)}
                          </p>
                        </div>
                      )}

                      {plan.interval === "one-time" && <p className="text-sm text-gray-600 mt-1">One-time unlock</p>}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Core Features */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Core Features
                      </h4>
                      <ul className="space-y-2">
                        {plan.features.slice(0, 5).map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* AI Features */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-600" />
                        AI Features
                      </h4>
                      <ul className="space-y-2">
                        {plan.aiFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Blockchain Features */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Blockchain Security
                      </h4>
                      <ul className="space-y-2">
                        {plan.blockchainFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* RPA Features */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Cog className="h-4 w-4 text-orange-600" />
                        RPA Automation
                      </h4>
                      <ul className="space-y-2">
                        {plan.rpaFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <Zap className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className={`w-full ${plan.popular ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""} ${
                        isRecommended ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""
                      } ${plan.isIntroOffer ? "bg-gradient-to-r from-orange-500 to-red-500" : ""}`}
                      variant={plan.popular || isRecommended || plan.isIntroOffer ? "default" : "outline"}
                      onClick={() => handlePlanSelection(plan.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.id === "intro" ? "Get Started" : plan.isIntroOffer ? "Claim Offer" : "Subscribe Now"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-8">
          {/* Feature Comparison Table */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Detailed Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Feature</th>
                      {ENHANCED_PLANS.map((plan) => (
                        <th key={plan.id} className="text-center p-4">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Social Feed Access", values: ["✓", "✓", "✓"] },
                      { name: "Video Reels", values: ["✓", "✓", "✓"] },
                      { name: "Private Messaging", values: ["✗", "✓", "✓"] },
                      { name: "AI Recommendations", values: ["Basic", "Advanced", "Premium"] },
                      { name: "Blockchain Security", values: ["Basic", "Enhanced", "Premium"] },
                      { name: "RPA Automation", values: ["Limited", "Full", "Enterprise"] },
                      { name: "Support Level", values: ["Email", "Priority", "Dedicated"] },
                      { name: "Pricing", values: ["₹99 one-time", "₹99/month (1 year)", "₹1,188/year"] },
                      { name: "After Intro Period", values: ["N/A", "₹499/month", "₹499/month"] },
                    ].map((feature, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{feature.name}</td>
                        {feature.values.map((value, i) => (
                          <td key={i} className="p-4 text-center">
                            {value === "✓" ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : value === "✗" ? (
                              <span className="text-gray-400">✗</span>
                            ) : (
                              <span className="text-sm">{value}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          {/* Platform Analytics */}
          {subscriptionStats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{subscriptionStats.total_users.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Subscriptions</p>
                      <p className="text-2xl font-bold">{subscriptionStats.active_subscriptions.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Crown className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Most Popular</p>
                      <p className="text-2xl font-bold">{subscriptionStats.popular_plan}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Satisfaction Rate</p>
                      <p className="text-2xl font-bold">{Math.round(subscriptionStats.satisfaction_rate * 100)}%</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Check className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <Progress value={subscriptionStats.satisfaction_rate * 100} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Why Choose Mahakavya */}
      <div className="glass p-8 max-w-4xl mx-auto text-center">
        <h3 className="text-2xl font-semibold mb-6">Why Choose Mahakavya?</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="space-y-2">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-medium">AI-Powered</h4>
            <p className="text-sm text-gray-600">
              Advanced AI recommendations and personalization for optimal user experience.
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-medium">Blockchain Secure</h4>
            <p className="text-sm text-gray-600">Your data is protected with cutting-edge blockchain technology.</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-3">
              <Cog className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-medium">RPA Automated</h4>
            <p className="text-sm text-gray-600">
              Intelligent automation handles routine tasks so you can focus on what matters.
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-3">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-medium">Community Focused</h4>
            <p className="text-sm text-gray-600">Built for meaningful connections and positive social impact.</p>
          </div>
        </div>
      </div>

      {/* Pricing FAQ */}
      <div className="glass p-8 max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-center">Pricing FAQ</h3>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">What happens after the introductory period?</h4>
            <p className="text-sm text-gray-600">
              After your first year at ₹99/month, your subscription will automatically renew at ₹499/month. You can
              cancel anytime before the renewal date.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">Can I switch between plans?</h4>
            <p className="text-sm text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your
              next billing cycle.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">Is the introductory offer available for existing users?</h4>
            <p className="text-sm text-gray-600">
              The introductory offer is available for new subscribers only. Existing users will continue with their
              current pricing.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600">
              We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure
              payment partner Razorpay.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
