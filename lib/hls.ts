export interface HLSConfig {
  quality: "auto" | "720p" | "480p" | "360p"
  autoplay: boolean
  muted: boolean
  loop: boolean
}

export const defaultHLSConfig: HLSConfig = {
  quality: "auto",
  autoplay: true,
  muted: true,
  loop: true,
}

export function createHLSPlayer(videoElement: HTMLVideoElement, src: string, config: HLSConfig = defaultHLSConfig) {
  // For now, we'll use native video playback
  // In production, you'd integrate with HLS.js or similar

  videoElement.src = src
  videoElement.autoplay = config.autoplay
  videoElement.muted = config.muted
  videoElement.loop = config.loop

  return {
    play: () => videoElement.play(),
    pause: () => videoElement.pause(),
    destroy: () => {
      videoElement.src = ""
    },
  }
}

export function generateHLSManifest(segments: string[], duration: number): string {
  const manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${Math.ceil(duration)}
#EXT-X-MEDIA-SEQUENCE:0
${segments.map((segment, index) => `#EXTINF:${duration},\n${segment}`).join("\n")}
#EXT-X-ENDLIST`

  return manifest
}
