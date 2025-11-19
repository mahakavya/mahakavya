"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Brain, Shield, Zap, TrendingUp } from "lucide-react"

interface SearchResult {
  id: string
  type: "user" | "post" | "campaign" | "group"
  title: string
  content: string
  author?: string
  timestamp: string
  relevanceScore: number
  verified: boolean
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recommendations, setRecommendations] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [aiOptimizing, setAiOptimizing] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [indexing, setIndexing] = useState(false)

  const mockResults: SearchResult[] = [
    {
      id: "1",
      type: "post",
      title: "The Path of Dharma in Modern Life",
      content: "Exploring how ancient wisdom applies to contemporary challenges...",
      author: "SpiritualSeeker",
      timestamp: new Date().toISOString(),
      relevanceScore: 0.95,
      verified: true,
    },
    {
      id: "2",
      type: "user",
      title: "Meditation Master",
      content: "Experienced meditation teacher sharing insights on mindfulness...",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      relevanceScore: 0.87,
      verified: true,
    },
    {
      id: "3",
      type: "campaign",
      title: "Build a Community Meditation Center",
      content: "Fundraising to create a peaceful space for community meditation...",
      author: "CommunityBuilder",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      relevanceScore: 0.82,
      verified: false,
    },
  ]

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)

    try {
      // Simulate AI-improved search
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const filteredResults = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.content.toLowerCase().includes(query.toLowerCase()),
      )

      setResults(filteredResults)

      // Generate AI recommendations
      const aiRecommendations = mockResults.filter((result) => !filteredResults.includes(result)).slice(0, 3)

      setRecommendations(aiRecommendations)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const optimizeSearchResults = async () => {
    setAiOptimizing(true)
    // Simulate AI optimization
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Re-rank results by relevance
    const optimizedResults = [...results].sort((a, b) => b.relevanceScore - a.relevanceScore)
    setResults(optimizedResults)
    setAiOptimizing(false)
  }

  const verifySearchData = async () => {
    setVerifying(true)
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mark results as verified
    const verifiedResults = results.map((result) => ({
      ...result,
      verified: true,
    }))
    setResults(verifiedResults)
    setVerifying(false)
  }

  const optimizeSearchIndex = async () => {
    setIndexing(true)
    // Simulate RPA indexing
    await new Promise((resolve) => setTimeout(resolve, 1800))

    // Simulate index optimization
    setIndexing(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return "👤"
      case "post":
        return "📝"
      case "campaign":
        return "🎯"
      case "group":
        return "👥"
      default:
        return "📄"
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      user: "bg-blue-100 text-blue-800",
      post: "bg-green-100 text-green-800",
      campaign: "bg-purple-100 text-purple-800",
      group: "bg-orange-100 text-orange-800",
    }
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{type}</Badge>
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return "text-green-600"
    if (score >= 0.7) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Search Platform</h1>
          <p className="text-gray-600">AI-powered search with blockchain verification and RPA optimization</p>
        </div>

        {/* Search Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for users, posts, campaigns, or groups..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Tools */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Optimization Tools</CardTitle>
              <CardDescription>Enhance your search results with AI, blockchain, and RPA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={optimizeSearchResults} disabled={aiOptimizing} variant="outline">
                  {aiOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      AI Optimize Results
                    </>
                  )}
                </Button>

                <Button onClick={verifySearchData} disabled={verifying} variant="outline">
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify Data
                    </>
                  )}
                </Button>

                <Button onClick={optimizeSearchIndex} disabled={indexing} variant="outline">
                  {indexing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Optimize Index
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Results ({results.length})
              </CardTitle>
              <CardDescription>Results ranked by AI relevance score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(result.type)}</span>
                        <div>
                          <h3 className="font-semibold">{result.title}</h3>
                          {result.author && <p className="text-sm text-gray-600">by {result.author}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(result.type)}
                        {result.verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{result.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                      <span className={`font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                        Relevance: {(result.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Personalized suggestions based on your search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-xl">{getTypeIcon(rec.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-sm text-gray-600">{rec.content.substring(0, 100)}...</div>
                    </div>
                    {getTypeBadge(rec.type)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {query && results.length === 0 && !loading && (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertDescription>
              No results found for "{query}". Try different keywords or use our AI optimization tools.
            </AlertDescription>
          </Alert>
        )}

        {/* Search Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Search Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">AI Enhancement</h3>
                <p className="text-sm text-gray-600">Intelligent search with personalized recommendations</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Verified Results</h3>
                <p className="text-sm text-gray-600">Blockchain-verified content for authenticity</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Auto Optimization</h3>
                <p className="text-sm text-gray-600">RPA-powered search indexing and optimization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
