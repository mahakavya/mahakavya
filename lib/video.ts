export async function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error("Failed to load video metadata"))
    }

    video.src = URL.createObjectURL(file)
  })
}

export async function extractThumbnail(fileOrUrl: File | string, atSeconds = 0.5): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Canvas context not available"))
      return
    }

    video.addEventListener("loadedmetadata", () => {
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Seek to the desired time
      video.currentTime = Math.min(atSeconds, video.duration)
    })

    video.addEventListener("seeked", () => {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to create thumbnail blob"))
          }

          // Clean up
          if (typeof fileOrUrl !== "string") {
            window.URL.revokeObjectURL(video.src)
          }
        },
        "image/jpeg",
        0.8,
      )
    })

    video.addEventListener("error", () => {
      if (typeof fileOrUrl !== "string") {
        window.URL.revokeObjectURL(video.src)
      }
      reject(new Error("Failed to load video"))
    })

    // Set video source
    if (typeof fileOrUrl === "string") {
      video.src = fileOrUrl
    } else {
      video.src = URL.createObjectURL(fileOrUrl)
    }

    video.load()
  })
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
