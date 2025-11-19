"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCreatePost } from "@/hooks/useSamvaaha"
import { useAuth } from "@/hooks/use-auth"
import { ImageIcon, X, Globe, Users, Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface MediaFile {
  file: File
  preview: string
  type: "image" | "video"
}

export function PostComposer() {
  const { user } = useAuth()
  const createPost = useCreatePost()
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach((file) => {
      if (mediaFiles.length >= 4) {
        toast.error("Maximum 4 media files allowed")
        return
      }

      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")

      if (!isImage && !isVideo) {
        toast.error("Only images and videos are allowed")
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB")
        return
      }

      const preview = URL.createObjectURL(file)
      const mediaFile: MediaFile = {
        file,
        preview,
        type: isImage ? "image" : "video",
      }

      setMediaFiles((prev) => [...prev, mediaFile])
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleSubmit = async () => {
    if (!body.trim() && mediaFiles.length === 0) {
      toast.error("Post must have text or media content")
      return
    }

    try {
      const mediaData = mediaFiles.map((media) => ({
        name: media.file.name,
        type: media.file.type,
        size: media.file.size,
      }))

      const result = await createPost.mutateAsync({
        body: body.trim() || undefined,
        media: mediaData.length > 0 ? mediaData : undefined,
        visibility,
      })

      // If there are upload URLs, upload the files
      if (result.uploadUrls && result.uploadUrls.length > 0) {
        const uploadPromises = result.uploadUrls.map(async (upload: any, index: number) => {
          const formData = new FormData()
          formData.append("file", mediaFiles[index].file)

          const response = await fetch(upload.signedUrl, {
            method: "PUT",
            body: mediaFiles[index].file,
            headers: {
              "Content-Type": mediaFiles[index].file.type,
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${mediaFiles[index].file.name}`)
          }
        })

        await Promise.all(uploadPromises)
      }

      // Reset form
      setBody("")
      setVisibility("PUBLIC")
      setMediaFiles([])
      setIsExpanded(false)

      toast.success("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create post")
    }
  }

  const visibilityIcons = {
    PUBLIC: <Globe className="h-4 w-4" />,
    FOLLOWERS: <Users className="h-4 w-4" />,
    PRIVATE: <Lock className="h-4 w-4" />,
  }

  const visibilityLabels = {
    PUBLIC: "Public",
    FOLLOWERS: "Followers",
    PRIVATE: "Private",
  }

  if (!user) return null

  return (
    <Card className="w-full backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{user.user_metadata?.display_name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's happening?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="min-h-[60px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0"
              maxLength={2000}
            />

            <AnimatePresence>
              {mediaFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {mediaFiles.map((media, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-lg overflow-hidden bg-muted"
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.preview || "/placeholder.svg"}
                          alt="Upload preview"
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <video src={media.preview} className="w-full h-32 object-cover" muted />
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                        {media.type === "image" ? "IMG" : "VID"}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaSelect}
                      className="hidden"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={mediaFiles.length >= 4}
                      className="h-8 px-2"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Photo
                    </Button>

                    <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                      <SelectTrigger className="w-auto h-8 border-0 bg-transparent">
                        <div className="flex items-center gap-1">
                          {visibilityIcons[visibility]}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="FOLLOWERS">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Followers
                          </div>
                        </SelectItem>
                        <SelectItem value="PRIVATE">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    {body.length > 0 && <span className="text-xs text-muted-foreground">{body.length}/2000</span>}

                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={createPost.isPending || (!body.trim() && mediaFiles.length === 0)}
                      className="h-8 px-4"
                    >
                      {createPost.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
