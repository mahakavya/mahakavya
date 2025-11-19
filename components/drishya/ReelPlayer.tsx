"use client"

import { useEffect, useRef, useState } from "react"
import { Play, VolumeX, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReelPlayerProps {
  src?: string
  poster?: string
  isActive: boolean
  onDoubleClick?: () => void
  showControls?: boolean
  className?: string
}

export function ReelPlayer({ src, poster, isActive, onDoubleClick, showControls = false, className }: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPlayButton, setShowPlayButton] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setShowPlayButton(false)
    }

    const handlePause = () => {
      setIsPlaying(false)
      setShowPlayButton(true)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      video.currentTime = 0
      if (isActive) {
        video.play() // Loop the video
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [isActive])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(console.error)
    } else {
      video.pause()
    }
  }, [isActive])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleVideoClick = () => {
    togglePlayPause()
  }

  const handleVideoDoubleClick = () => {
    onDoubleClick?.()
  }

  if (!src) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
      />

      {/* Play/Pause Overlay */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Button
            onClick={togglePlayPause}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16 p-0"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      {/* Controls */}
      {(showControls || showPlayButton) && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button onClick={toggleMute} className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}
