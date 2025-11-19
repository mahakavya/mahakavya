const BUCKET_NAME = "samvaaha-media"
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

export interface MediaUpload {
  name: string
  type: string
  size: number
}

export interface SignedUploadResponse {
  signedUrl: string
  path: string
  token: string
}

export async function signUpload(path: string, contentType: string, size: number): Promise<SignedUploadResponse> {
  // Validate file type and size
  if (size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum allowed size")
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType)

  if (!isImage && !isVideo) {
    throw new Error("File type not allowed")
  }

  const { createServiceClient } = await import("./supabase/server")
  const supabase = await createServiceClient()

  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUploadUrl(path)

  if (error) {
    console.error("Error creating signed upload URL:", error)
    throw new Error("Failed to create upload URL")
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  }
}

export async function getPublicUrl(path: string): Promise<string> {
  const { createClient } = await import("./supabase/client")
  const supabase = createClient()

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)

  return data.publicUrl
}

// Client-friendly helper that requests a signed URL (server RPC) and uploads the file
export async function uploadCampaignCover(file: File, userId: string) {
  const path = generateMediaPath(userId, file.name)
  const signed = await signUpload(path, file.type, file.size)

  // Upload file to signed URL
  const res = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  })

  if (!res.ok) {
    throw new Error("Upload failed")
  }

  return {
    url: await getPublicUrl(path),
    path,
  }
}

// Convenience wrappers for reels and chat attachments
export async function uploadReelVideo(file: File, userId: string) {
  // Use a dedicated folder for reels
  const path = `reels/${userId}/${Date.now()}_${file.name}`
  const signed = await signUpload(path, file.type, file.size)

  const res = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  })

  if (!res.ok) throw new Error("Failed to upload reel video")

  return { url: await getPublicUrl(path), path }
}

export async function uploadReelThumb(blob: Blob, userId: string) {
  const fileName = `thumb_${Date.now()}.png`
  const path = `reels/${userId}/${fileName}`
  // Blob doesn't have size/type strongly typed here; coerce
  const size = (blob as any).size ?? 0
  const type = (blob as any).type ?? "image/png"

  const signed = await signUpload(path, type, size)

  const res = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "content-type": type },
    body: blob as any,
  })

  if (!res.ok) throw new Error("Failed to upload thumbnail")

  return { url: await getPublicUrl(path), path }
}

export async function uploadChatAttachment(file: File, userId: string) {
  const path = `chat/${userId}/${Date.now()}_${file.name}`
  const signed = await signUpload(path, file.type, file.size)

  const res = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  })

  if (!res.ok) throw new Error("Failed to upload attachment")

  return { url: await getPublicUrl(path), path }
}

export async function deleteFile(path: string): Promise<void> {
  const { createServiceClient } = await import("./supabase/server")
  const supabase = await createServiceClient()

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) {
    console.error("Error deleting file:", error)
    throw new Error("Failed to delete file")
  }
}

export async function deleteCampaignCover(path: string): Promise<void> {
  // Thin wrapper for semantics
  return deleteFile(path)
}

export function getStoragePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Supabase public URLs often include /object/public/<bucket>/<path>
    const parts = u.pathname.split("/")
    const idx = parts.findIndex((p) => p === BUCKET_NAME)
    if (idx >= 0) {
      return parts.slice(idx + 1).join("/")
    }
    // Fallback: try to extract after '/public/'
    const pubIdx = parts.findIndex((p) => p === "public")
    if (pubIdx >= 0) return parts.slice(pubIdx + 2).join("/")
    return null
  } catch (e) {
    return null
  }
}

export function generateMediaPath(postId: string, fileName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = fileName.split(".").pop()
  return `posts/${postId}/${timestamp}_${randomId}.${extension}`
}

export function validateMediaFile(file: MediaUpload): boolean {
  if (file.size > MAX_FILE_SIZE) return false

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  return isImage || isVideo
}

// Backwards-compatible helper expected by some components
export function validateVideoFile(file: any): string | null {
  const size = (file as any).size ?? 0
  const type = (file as any).type ?? ""
  if (!ALLOWED_VIDEO_TYPES.includes(type)) return "Unsupported video format"
  if (size > MAX_FILE_SIZE) return "Video exceeds maximum allowed size"
  return null
}

export function getMediaType(contentType: string): "image" | "video" | null {
  if (ALLOWED_IMAGE_TYPES.includes(contentType)) return "image"
  if (ALLOWED_VIDEO_TYPES.includes(contentType)) return "video"
  return null
}

// Delete multiple reel files in a single call (used by server routes)
export async function deleteReelFiles(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return

  const { createServiceClient } = await import("./supabase/server")
  const supabase = await createServiceClient()

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths)

  if (error) {
    console.error("Error deleting reel files:", error)
    throw new Error("Failed to delete reel files")
  }
}
