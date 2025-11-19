"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ImageIcon,
  Hash,
  X,
  Loader2,
  Sparkles,
  Globe,
  Users,
  Lock,
  Brain,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface PostComposerProps {
  onPostCreated?: (post: any) => void
  onCancel?: () => void
}

interface AIAnalysis {
  score: number
  sentiment: string
  suggestions: string[]
  culturalSensitivity: number
  toxicity: number
}

export function PostComposer({ onPostCreated, onCancel }: PostComposerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("general")
  const [privacy, setPrivacy] = useState("public")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<string>("ready")
  const [rpaStatus, setRpaStatus] = useState<string>("ready")

  const categories = [
    { value: "general", label: "General" },
    { value: "spiritual", label: "Spiritual" },
    { value: "philosophy", label: "Philosophy" },
    { value: "community", label: "Community" },
    { value: "culture", label: "Culture" },
    { value: "wellness", label: "Wellness" },
    { value: "education", label: "Education" },
  ]

  const privacyOptions = [
    { value: "public", label: "Public", icon: Globe },
    { value: "followers", label: "Followers Only", icon: Users },
    { value: "private", label: "Private", icon: Lock },
  ]

  const handleContentChange = async (newContent: string) => {
    setContent(newContent)

    // Trigger AI analysis for content longer than 20 characters
    if (newContent.length > 20 && !isAnalyzing) {
      setIsAnalyzing(true)
      try {
        const response = await fetch("/api/feed/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: "draft",
            content: newContent,
          }),
        })

        if (response.ok) {
          const analysis = await response.json()
          setAiAnalysis(analysis)
        }
      } catch (error) {
        console.error("AI analysis failed:", error)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith("image/") || file.type.startsWith("video/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB

      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: "Please select images or videos only",
          variant: "destructive",
        })
        return false
      }

      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please select files smaller than 10MB",
          variant: "destructive",
        })
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      setMediaFiles((prev) => [...prev, ...validFiles].slice(0, 4))
      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file)
        setMediaUrls((prev) => [...prev, url].slice(0, 4))
      })
    }
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaUrls((prev) => {
      const newUrls = prev.filter((_, i) => i !== index)
      URL.revokeObjectURL(prev[index])
      return newUrls
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags((prev) => [...prev, tagInput.trim().toLowerCase()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (tagInput.trim()) {
        addTag()
      }
    }
  }

  const enhanceWithAI = async () => {
    if (!content.trim()) {
      toast({
        title: "No content to enhance",
        description: "Please write some content first",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/ai/enhance-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const { enhancedContent, suggestions } = await response.json()
        setContent(enhancedContent)

        toast({
          title: "Content enhanced!",
          description: "Your post has been improved with AI suggestions",
        })
      }
    } catch (error) {
      toast({
        title: "Enhancement failed",
        description: "Unable to enhance your post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some content or media",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)
    setBlockchainStatus("processing")
    setRpaStatus("processing")

    try {
      // Upload media files if any
      let uploadedUrls: string[] = []
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) throw new Error(`Failed to upload ${file.name}`)

          const { url } = await response.json()
          return url
        })

        uploadedUrls = await Promise.all(uploadPromises)
      }

      // Create post
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          media_urls: uploadedUrls,
          tags,
          category,
          location,
          privacy,
        }),
      })

      if (response.ok) {
        const post = await response.json()

        // Trigger blockchain verification
        setBlockchainStatus("verifying")
        try {
          await fetch("/api/feed/blockchain-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: post.id }),
          })
          setBlockchainStatus("verified")
        } catch {
          setBlockchainStatus("failed")
        }

        // Trigger RPA processing
        setRpaStatus("analyzing")
        try {
          await fetch("/api/feed/rpa-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: post.id }),
          })
          setRpaStatus("processed")
        } catch {
          setRpaStatus("failed")
        }

        onPostCreated?.(post)

        // Reset form
        setContent("")
        setLocation("")
        setCategory("general")
        setPrivacy("public")
        setTags([])
        setTagInput("")
        setMediaFiles([])
        setMediaUrls((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url))
          return []
        })
        setShowAdvanced(false)
        setAiAnalysis(null)
        setBlockchainStatus("ready")
        setRpaStatus("ready")

        toast({
          title: "Post created successfully!",
          description: "Your post has been shared with the community",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create post")
      }
    } catch (error) {
      toast({
        title: "Failed to create post",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
      setBlockchainStatus("failed")
      setRpaStatus("failed")
    } finally {
      setIsPosting(false)
    }
  }

  const getAIScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-3 w-3 text-gray-400" />
      case "processing":
      case "verifying":
      case "analyzing":
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
      case "verified":
      case "processed":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "failed":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      default:
        return <Info className="h-3 w-3 text-gray-400" />
    }
  }

  if (!user) return null

  return (
    <Card className="border-orange-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Share Your Thoughts
          <div className="ml-auto flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Blockchain Secured
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              RPA Optimized
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt="Your avatar" />
              <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
              <div className="flex items-center gap-2">
                <Select value={privacy} onValueChange={setPrivacy}>
                  <SelectTrigger className="w-auto h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {privacyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-3 w-3" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Content Input */}
          <Textarea
            placeholder="What's on your mind? Share your thoughts, experiences, or wisdom with the community..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[120px] resize-none border-orange-200 focus:border-orange-400"
            maxLength={2000}
          />

          {/* Character Count and AI Analysis */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">{content.length}/2000</span>
              {isAnalyzing && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Brain className="h-3 w-3 animate-pulse" />
                  <span className="text-xs">AI analyzing...</span>
                </div>
              )}
            </div>
            {content.length > 1800 && (
              <span className="text-orange-500">{2000 - content.length} characters remaining</span>
            )}
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <Alert className="border-purple-200 bg-purple-50">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">AI Quality Score</span>
                    <Badge variant="outline" className={getAIScoreColor(aiAnalysis.score)}>
                      {(aiAnalysis.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={aiAnalysis.score * 100} className="h-2" />
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Sentiment:</strong> {aiAnalysis.sentiment}
                    </p>
                    <p>
                      <strong>Cultural Sensitivity:</strong> {(aiAnalysis.culturalSensitivity * 100).toFixed(0)}%
                    </p>
                    {aiAnalysis.suggestions.length > 0 && (
                      <div>
                        <strong>Suggestions:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {aiAnalysis.suggestions.slice(0, 2).map((suggestion, index) => (
                            <li key={index} className="text-xs">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Add location (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags (up to 5)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={tags.length >= 5}
                  />
                  <Button type="button" onClick={addTag} disabled={!tagInput.trim() || tags.length >= 5} size="sm">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Technology Status */}
          {isPosting && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm">Processing Status</h4>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(blockchainStatus)}
                  <span>Blockchain: {blockchainStatus}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(rpaStatus)}
                  <span>RPA: {rpaStatus}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-3 w-3 text-purple-500" />
                  <span>AI: {aiAnalysis ? "analyzed" : "ready"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaFiles.length >= 4}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Media ({mediaFiles.length}/4)
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={enhanceWithAI}
                disabled={!content.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Enhance
              </Button>

              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                <Hash className="h-4 w-4 mr-2" />
                {showAdvanced ? "Hide" : "More"} Options
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={(!content.trim() && mediaFiles.length === 0) || isPosting}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Post...
                  </>
                ) : (
                  "Share Post"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
