import { createSupabaseServerClient } from "@/lib/supabase-server"

export interface LiveStream {
  id: string
  title: string
  description: string
  streamerId: string
  status: "scheduled" | "live" | "ended"
  startedAt?: string
  endedAt?: string
  viewerCount: number
  chatEnabled: boolean
  streamKey?: string
  playbackUrl?: string
}

export interface StreamMessage {
  id: string
  streamId: string
  userId: string
  username: string
  message: string
  timestamp: string
}

export class LiveStreamingService {
  private supabase

  constructor() {
    this.supabase = createSupabaseServerClient()
  }

  /**
   * Create a new live stream
   */
  async createStream(data: {
    title: string
    description: string
    streamerId: string
    scheduledFor?: string
    chatEnabled?: boolean
  }): Promise<LiveStream> {
    // Generate unique stream key for RTMP ingest
    const streamKey = this.generateStreamKey()

    const { data: stream, error } = await this.supabase
      .from("live_streams")
      .insert({
        title: data.title,
        description: data.description,
        streamer_id: data.streamerId,
        status: data.scheduledFor ? "scheduled" : "live",
        scheduled_for: data.scheduledFor,
        chat_enabled: data.chatEnabled ?? true,
        stream_key: streamKey,
        playback_url: `https://stream.mahakavya.social/${streamKey}/playlist.m3u8`,
        viewer_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    return this.mapToLiveStream(stream)
  }

  /**
   * Start a scheduled stream
   */
  async startStream(streamId: string, streamerId: string): Promise<LiveStream> {
    const { data: stream, error } = await this.supabase
      .from("live_streams")
      .update({
        status: "live",
        started_at: new Date().toISOString(),
      })
      .eq("id", streamId)
      .eq("streamer_id", streamerId)
      .select()
      .single()

    if (error) throw error

    // Notify followers
    await this.notifyFollowers(streamerId, streamId)

    return this.mapToLiveStream(stream)
  }

  /**
   * End a live stream
   */
  async endStream(streamId: string, streamerId: string): Promise<void> {
    await this.supabase
      .from("live_streams")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", streamId)
      .eq("streamer_id", streamerId)
  }

  /**
   * Get active live streams
   */
  async getActiveStreams(limit = 20): Promise<LiveStream[]> {
    const { data, error } = await this.supabase
      .from("live_streams")
      .select("*, profiles(username, avatar_url)")
      .eq("status", "live")
      .order("viewer_count", { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map(this.mapToLiveStream)
  }

  /**
   * Join a stream as viewer
   */
  async joinStream(streamId: string, userId: string): Promise<LiveStream> {
    // Increment viewer count
    const { data: stream } = await this.supabase.from("live_streams").select("*").eq("id", streamId).single()

    if (!stream) throw new Error("Stream not found")

    await this.supabase
      .from("live_streams")
      .update({
        viewer_count: (stream.viewer_count || 0) + 1,
      })
      .eq("id", streamId)

    // Record viewer
    await this.supabase.from("stream_viewers").insert({
      stream_id: streamId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    })

    return this.mapToLiveStream({ ...stream, viewer_count: stream.viewer_count + 1 })
  }

  /**
   * Leave a stream
   */
  async leaveStream(streamId: string, userId: string): Promise<void> {
    // Decrement viewer count
    const { data: stream } = await this.supabase.from("live_streams").select("viewer_count").eq("id", streamId).single()

    if (stream) {
      await this.supabase
        .from("live_streams")
        .update({
          viewer_count: Math.max((stream.viewer_count || 0) - 1, 0),
        })
        .eq("id", streamId)
    }

    // Update viewer record
    await this.supabase
      .from("stream_viewers")
      .update({ left_at: new Date().toISOString() })
      .eq("stream_id", streamId)
      .eq("user_id", userId)
      .is("left_at", null)
  }

  /**
   * Send chat message
   */
  async sendChatMessage(streamId: string, userId: string, message: string): Promise<StreamMessage> {
    const { data: profile } = await this.supabase.from("profiles").select("username").eq("user_id", userId).single()

    const { data: chatMessage, error } = await this.supabase
      .from("stream_chat")
      .insert({
        stream_id: streamId,
        user_id: userId,
        message: message,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: chatMessage.id,
      streamId: chatMessage.stream_id,
      userId: chatMessage.user_id,
      username: profile?.username || "Anonymous",
      message: chatMessage.message,
      timestamp: chatMessage.timestamp,
    }
  }

  /**
   * Get stream analytics
   */
  async getStreamAnalytics(streamId: string) {
    const [stream, viewers, messages, reactions] = await Promise.all([
      this.supabase.from("live_streams").select("*").eq("id", streamId).single(),

      this.supabase.from("stream_viewers").select("*").eq("stream_id", streamId),

      this.supabase.from("stream_chat").select("id").eq("stream_id", streamId),

      this.supabase.from("stream_reactions").select("reaction_type").eq("stream_id", streamId),
    ])

    const avgViewDuration = this.calculateAvgViewDuration(viewers.data || [])

    return {
      totalViewers: viewers.data?.length || 0,
      peakViewers: stream.data?.viewer_count || 0,
      totalMessages: messages.data?.length || 0,
      avgViewDuration,
      reactions: this.groupReactions(reactions.data || []),
      duration: this.calculateDuration(stream.data?.started_at, stream.data?.ended_at),
    }
  }

  private generateStreamKey(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  private async notifyFollowers(streamerId: string, streamId: string) {
    const { data: followers } = await this.supabase.from("follows").select("follower_id").eq("following_id", streamerId)

    if (followers && followers.length > 0) {
      const notifications = followers.map((f) => ({
        user_id: f.follower_id,
        type: "live_stream_started",
        title: "Live Stream Started",
        message: "Someone you follow is now live!",
        data: { streamId },
      }))

      await this.supabase.from("notifications").insert(notifications)
    }
  }

  private mapToLiveStream(data: any): LiveStream {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      streamerId: data.streamer_id,
      status: data.status,
      startedAt: data.started_at,
      endedAt: data.ended_at,
      viewerCount: data.viewer_count || 0,
      chatEnabled: data.chat_enabled,
      streamKey: data.stream_key,
      playbackUrl: data.playback_url,
    }
  }

  private calculateAvgViewDuration(viewers: any[]): number {
    if (viewers.length === 0) return 0

    const durations = viewers
      .filter((v) => v.left_at)
      .map((v) => {
        const joined = new Date(v.joined_at).getTime()
        const left = new Date(v.left_at).getTime()
        return (left - joined) / 1000 / 60 // minutes
      })

    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
  }

  private groupReactions(reactions: any[]) {
    return reactions.reduce((acc, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
      return acc
    }, {})
  }

  private calculateDuration(startedAt?: string, endedAt?: string): number {
    if (!startedAt) return 0
    const end = endedAt ? new Date(endedAt) : new Date()
    const start = new Date(startedAt)
    return (end.getTime() - start.getTime()) / 1000 / 60 // minutes
  }
}

export const liveStreamingService = new LiveStreamingService()
