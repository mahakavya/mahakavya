"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { getPublicUrl } from "@/lib/storage"

interface MediaGridProps {
  mediaUrls: string[]
  mediaTypes: string[]
}

export function MediaGrid({ mediaUrls, mediaTypes }: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null)
  const [videoStates, setVideoStates] = useState<Record<number, { playing: boolean; muted: boolean }>>({})
  const [publicUrls, setPublicUrls] = useState<(string | null)[]>([])

  if (!mediaUrls.length) return null

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resolved = await Promise.all(mediaUrls.map((u) => getPublicUrl(u).catch(() => "")))
        if (mounted) setPublicUrls(resolved)
      } catch (e) {
        if (mounted) setPublicUrls(mediaUrls.map(() => ""))
      }
    })()

    return () => {
      mounted = false
    }
  }, [mediaUrls])

  const toggleVideoState = (index: number, property: "playing" | "muted") => {
    setVideoStates((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [property]: !prev[index]?.[property],
      },
    }))
  }

  const getGridClass = () => {
    switch (mediaUrls.length) {
      case 1:
        return "grid-cols-1"
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-2"
      case 4:
        return "grid-cols-2"
      default:
        return "grid-cols-2"
    }
  }

  const getItemClass = (index: number) => {
    if (mediaUrls.length === 3 && index === 0) {
      return "col-span-2"
    }
    return ""
  }

  return (
    <>
      <div className={`grid ${getGridClass()} gap-2 mb-3 rounded-lg overflow-hidden`}>
        {mediaUrls.map((url, index) => {
          const isVideo = mediaTypes[index] === "video"
          const publicUrl = publicUrls[index] || ""
          const videoState = videoStates[index] || { playing: false, muted: true }

          return (
            <motion.div
              key={index}
              className={`relative group cursor-pointer bg-muted ${getItemClass(index)}`}
              style={{ aspectRatio: mediaUrls.length === 1 ? "auto" : "1" }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedMedia(index)}
            >
              {isVideo ? (
                <div className="relative w-full h-full">
                  <video
                    src={publicUrl}
                    className="w-full h-full object-cover"
                    muted={videoState.muted}
                    loop
                    playsInline
                    ref={(video) => {
                      if (video) {
                        if (videoState.playing) {
                          video.play()
                        } else {
                          video.pause()
                        }
                      }
                    }}
                  />

                  {/* Video Controls Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVideoState(index, "playing")
                        }}
                      >
                        {videoState.playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVideoState(index, "muted")
                        }}
                      >
                        {videoState.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Video Badge */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">VIDEO</div>
                </div>
              ) : (
                <img
                  src={publicUrl || "/placeholder.svg"}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              )}

              {/* Multiple media indicator */}
              {mediaUrls.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}/{mediaUrls.length}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Media Viewer Dialog */}
      <Dialog open={selectedMedia !== null} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <AnimatePresence mode="wait">
            {selectedMedia !== null && (
              <motion.div
                key={selectedMedia}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full flex items-center justify-center bg-black"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setSelectedMedia(null)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {mediaTypes[selectedMedia] === "video" ? (
                  <video
                    src={publicUrls[selectedMedia!] || ""}
                    className="max-w-full max-h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={publicUrls[selectedMedia!] || "/placeholder.svg"}
                    alt={`Media ${selectedMedia + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                )}

                {/* Navigation */}
                {mediaUrls.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {mediaUrls.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === selectedMedia ? "bg-white" : "bg-white/50"
                        }`}
                        onClick={() => setSelectedMedia(index)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
