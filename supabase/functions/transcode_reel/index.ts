import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface TranscodeRequest {
  reelId: string
  uploadPath: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const { reelId, uploadPath }: TranscodeRequest = await req.json()

    console.log(`Starting transcoding for reel ${reelId} at path ${uploadPath}`)

    // Download the uploaded video
    const { data: videoData, error: downloadError } = await supabaseClient.storage
      .from("drishya-uploads")
      .download(uploadPath)

    if (downloadError) {
      throw new Error(`Failed to download video: ${downloadError.message}`)
    }

    // Convert to ArrayBuffer for processing
    const videoBuffer = await videoData.arrayBuffer()
    const videoBytes = new Uint8Array(videoBuffer)

    // Generate thumbnail (simplified - in production use FFmpeg)
    const thumbnailPath = `${reelId}/thumb.jpg`

    // For now, create a simple placeholder thumbnail
    // In production, you'd use FFmpeg to extract a frame
    const placeholderThumb = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00,
      0x00, 0xff, 0xdb, 0x00, 0x43,
    ])

    // Upload thumbnail
    const { error: thumbError } = await supabaseClient.storage
      .from("drishya-thumbs")
      .upload(thumbnailPath, placeholderThumb, {
        contentType: "image/jpeg",
        upsert: true,
      })

    if (thumbError) {
      console.error("Failed to upload thumbnail:", thumbError)
    }

    // Generate HLS playlist (simplified)
    const hlsPath = `${reelId}/playlist.m3u8`
    const segmentPath = `${reelId}/segment0.ts`

    // Create basic HLS playlist
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment0.ts
#EXT-X-ENDLIST`

    // Upload HLS files
    const { error: playlistError } = await supabaseClient.storage.from("drishya-stream").upload(hlsPath, playlist, {
      contentType: "application/x-mpegURL",
      upsert: true,
    })

    // For demo, just copy the original video as segment
    const { error: segmentError } = await supabaseClient.storage
      .from("drishya-stream")
      .upload(segmentPath, videoBytes, {
        contentType: "video/mp2t",
        upsert: true,
      })

    if (playlistError || segmentError) {
      throw new Error("Failed to upload HLS files")
    }

    // Get public URLs
    const { data: thumbUrl } = supabaseClient.storage.from("drishya-thumbs").getPublicUrl(thumbnailPath)

    const { data: hlsUrl } = supabaseClient.storage.from("drishya-stream").getPublicUrl(hlsPath)

    // Update reel record with processed URLs
    const { error: updateError } = await supabaseClient
      .from("reels")
      .update({
        status: "READY",
        hls_url: hlsUrl.publicUrl,
        thumb_url: thumbUrl.publicUrl,
        duration_seconds: 10, // Would be extracted from video metadata
        width: 720,
        height: 1280,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reelId)

    if (updateError) {
      throw new Error(`Failed to update reel: ${updateError.message}`)
    }

    console.log(`Successfully transcoded reel ${reelId}`)

    return new Response(
      JSON.stringify({
        success: true,
        reelId,
        hlsUrl: hlsUrl.publicUrl,
        thumbUrl: thumbUrl.publicUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Transcoding error:", error)

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
