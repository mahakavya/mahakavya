"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, Loader2, Play, Pause } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
// Note: storage helpers are dynamically imported where used to avoid pulling server-only code
import { probeVideoDuration, extractThumbnail, formatDuration } from "@/lib/video"
import { ReelCreateSchema } from "@/lib/validators"
import { getCurrentProfile } from "@/lib/db"
import { createSupabaseBrowserClient } from "@/lib/supabase"

interface ReelUploaderProps {
  onReelCreated?: (reel: any) => void
  onClose?: () => void
}

export function ReelUploader({ onReelCreated, onClose }: ReelUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [caption, setCaption] = useState("")
  const [duration, setDuration] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Load user profile on mount
  useState(() => {
    async function loadProfile() {
      try {
        const supabase = createSupabaseBrowserClient()
        const profileData = await getCurrentProfile(supabase)
        setProfile(profileData)
      } catch (error) {
        console.error("Failed to load profile:", error)
      }
    }
    loadProfile()
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
  const { validateVideoFile } = await import("@/lib/storage")
  const validationError = validateVideoFile(file as any)
    if (validationError) {
      toast({
        title: "Invalid video file",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    try {
      // Check duration
      const videoDuration = await probeVideoDuration(file)
      if (videoDuration > 60) {
        toast({
          title: "Video too long",
          description: "Videos must be 60 seconds or shorter.",
          variant: "destructive",
        })
        return
      }

      setDuration(videoDuration)
      setSelectedFile(file)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setVideoPreview(previewUrl)

      // Generate thumbnail
      const thumbnail = await extractThumbnail(file, 0.5)
      setThumbnailBlob(thumbnail)

      toast({
        title: "Video loaded",
        description: `Duration: ${formatDuration(videoDuration)}`,
      })
    } catch (error) {
      console.error("File processing error:", error)
      toast({
        title: "Failed to process video",
        description: "Please try a different video file.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFile = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setSelectedFile(null)
    setVideoPreview(null)
    setThumbnailBlob(null)
    setDuration(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !profile) {
      toast({
        title: "Error",
        description: "Please select a video and sign in.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Upload video
      setUploadProgress(25)
  const { uploadReelVideo, uploadReelThumb } = await import("@/lib/storage")
  const videoResult = await uploadReelVideo(selectedFile, profile.id)

      // Upload thumbnail if available
      setUploadProgress(50)
      let thumbResult = null
      if (thumbnailBlob) {
        thumbResult = await uploadReelThumb(thumbnailBlob as any, profile.id)
      }

      // Create reel
      setUploadProgress(75)
      const reelData = ReelCreateSchema.parse({
        videoUrl: videoResult.url,
        thumbUrl: thumbResult?.url,
        caption: caption.trim() || undefined,
      })

      const response = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reelData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create reel")
      }

      const { reel } = await response.json()
      setUploadProgress(100)

      // Reset form
      handleRemoveFile()
      setCaption("")

      toast({
        title: "Reel uploaded!",
        description: "Your reel has been shared successfully.",
      })

      onReelCreated?.(reel)
      onClose?.()
    } catch (error) {
      console.error("Reel upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className="glass w-full max-w-md mx-auto" data-testid="reel-uploader">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Upload Reel</span>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          {!selectedFile && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to upload a video</p>
              <p className="text-sm text-gray-500">MP4, WebM, or MOV • Max 100MB • Max 60s</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/mov"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          )}

          {/* Video Preview */}
          {selectedFile && videoPreview && (
            <div className="space-y-3">
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden max-h-80">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 text-white hover:bg-black/70 h-12 w-12"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {duration && <p className="text-sm text-gray-600 text-center">Duration: {formatDuration(duration)}</p>}
            </div>
          )}

          {/* Caption Input */}
          {selectedFile && (
            <div className="space-y-2">
              <label htmlFor="caption" className="text-sm font-medium text-gray-700">
                Caption (optional)
              </label>
              <Textarea
                id="caption"
                placeholder="Write a caption for your reel..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={2200}
                disabled={isUploading}
              />
              <div className="text-right text-sm text-gray-500">{caption.length}/2200</div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Submit Button */}
          {selectedFile && (
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Share Reel"
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
