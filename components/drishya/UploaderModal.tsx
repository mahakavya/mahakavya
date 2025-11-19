"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Play, Pause, Music } from "lucide-react"
import { useCreateReel } from "@/hooks/drishya/useCreateReel"
import { useToast } from "@/hooks/use-toast"

interface UploaderModalProps {
  isOpen: boolean
  onClose: () => void
  onReelUploaded: (reel: any) => void
}

export function UploaderModal({ isOpen, onClose, onReelUploaded }: UploaderModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [audioTitle, setAudioTitle] = useState("")
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { mutate: createReel } = useCreateReel()
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      toast({
        title: "File too large",
        description: "Please select a video smaller than 100MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const togglePreviewPlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create reel record and get upload URL
      createReel(
        {
          caption: caption.trim() || undefined,
          tags,
          visibility,
          audioTitle: audioTitle.trim() || undefined,
        },
        {
          onSuccess: async (data) => {
            try {
              // Upload video file
              const uploadResponse = await fetch(data.uploadUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": selectedFile.type,
                },
                body: selectedFile,
              })

              if (!uploadResponse.ok) {
                throw new Error("Failed to upload video")
              }

              setUploadProgress(50)

              // Finalize reel
              const finalizeResponse = await fetch(`/api/drishya/reels/${data.reelId}/finalize`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  uploadPath: data.uploadPath,
                }),
              })

              if (!finalizeResponse.ok) {
                throw new Error("Failed to finalize reel")
              }

              const finalizedReel = await finalizeResponse.json()
              setUploadProgress(100)

              // Reset form
              setSelectedFile(null)
              setCaption("")
              setTags([])
              setAudioTitle("")
              setPreviewUrl(null)
              setUploadProgress(0)

              onReelUploaded(finalizedReel)

              toast({
                title: "Upload successful!",
                description: "Your reel is being processed and will appear in the feed soon.",
              })
            } catch (error) {
              console.error("Upload error:", error)
              toast({
                title: "Upload failed",
                description: "Failed to upload your reel. Please try again.",
                variant: "destructive",
              })
            } finally {
              setIsUploading(false)
            }
          },
          onError: (error) => {
            console.error("Create reel error:", error)
            toast({
              title: "Upload failed",
              description: "Failed to create reel. Please try again.",
              variant: "destructive",
            })
            setIsUploading(false)
          },
        },
      )
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) return

    // Cleanup preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    // Reset form
    setSelectedFile(null)
    setCaption("")
    setTags([])
    setTagInput("")
    setAudioTitle("")
    setUploadProgress(0)

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload New Reel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">Click to select a video</p>
              <p className="text-sm text-gray-400">MP4, WebM up to 100MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-64">
                <video
                  ref={videoRef}
                  src={previewUrl || undefined}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <Button
                  onClick={togglePreviewPlay}
                  className="absolute inset-0 bg-black/50 hover:bg-black/70 text-white"
                  variant="ghost"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{selectedFile.name}</span>
                <Button
                  onClick={() => {
                    setSelectedFile(null)
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl)
                      setPreviewUrl(null)
                    }
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your reel..."
              maxLength={2200}
              rows={3}
            />
            <div className="text-xs text-gray-500 text-right">{caption.length}/2200</div>
          </div>

          {/* Audio Title */}
          <div className="space-y-2">
            <Label htmlFor="audio">Audio/Music Title</Label>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="audio"
                value={audioTitle}
                onChange={(e) => setAudioTitle(e.target.value)}
                placeholder="Original audio or music title"
                className="pl-10"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add tags..."
                maxLength={30}
              />
              <Button
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    #{tag} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500">{tags.length}/10 tags</div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex space-x-2">
              {(["PUBLIC", "FOLLOWERS", "PRIVATE"] as const).map((option) => (
                <Button
                  key={option}
                  onClick={() => setVisibility(option)}
                  variant={visibility === option ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                >
                  {option.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1 bg-transparent" disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isUploading ? "Uploading..." : "Upload Reel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
