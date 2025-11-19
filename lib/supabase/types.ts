export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string
          email: string | null
          avatar_url: string | null
          role: "USER" | "ADMIN" | "SUPER_ADMIN" | "MASTER_ADMIN"
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          display_name: string
          email?: string | null
          avatar_url?: string | null
          role?: "USER" | "ADMIN" | "SUPER_ADMIN" | "MASTER_ADMIN"
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string
          email?: string | null
          avatar_url?: string | null
          role?: "USER" | "ADMIN" | "SUPER_ADMIN" | "MASTER_ADMIN"
          created_at?: string
          updated_at?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          body: string | null
          media_urls: string[]
          media_types: string[]
          visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
          comment_count: number
          like_count: number
          share_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          body?: string | null
          media_urls?: string[]
          media_types?: string[]
          visibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
          comment_count?: number
          like_count?: number
          share_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          body?: string | null
          media_urls?: string[]
          media_types?: string[]
          visibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
          comment_count?: number
          like_count?: number
          share_count?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          body: string
          like_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          body: string
          like_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          body?: string
          like_count?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      post_likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      moderation_flags: {
        Row: {
          id: number
          content_type: "post" | "comment"
          content_id: string
          reporter_id: string | null
          reason: string
          status: "PENDING" | "APPROVED" | "REJECTED"
          created_at: string
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: number
          content_type: "post" | "comment"
          content_id: string
          reporter_id?: string | null
          reason: string
          status?: "PENDING" | "APPROVED" | "REJECTED"
          created_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: number
          content_type?: "post" | "comment"
          content_id?: string
          reporter_id?: string | null
          reason?: string
          status?: "PENDING" | "APPROVED" | "REJECTED"
          created_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
      follows: {
        Row: {
          follower_id: string
          followee_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          followee_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          followee_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "like" | "comment" | "follow" | "mention"
          content: any
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "like" | "comment" | "follow" | "mention"
          content: any
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "like" | "comment" | "follow" | "mention"
          content?: any
          read?: boolean
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          actor_id: string
          action: string
          target: string | null
          meta: any | null
          created_at: string
        }
        Insert: {
          id?: number
          actor_id: string
          action: string
          target?: string | null
          meta?: any | null
          created_at?: string
        }
        Update: {
          id?: number
          actor_id?: string
          action?: string
          target?: string | null
          meta?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          uid: string
        }
        Returns: boolean
      }
      can_view_post: {
        Args: {
          p: Database["public"]["Tables"]["posts"]["Row"]
          uid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  author: Database["public"]["Tables"]["user_profiles"]["Row"]
  viewerHasLiked?: boolean
  viewerBookmarked?: boolean
}

export type Comment = Database["public"]["Tables"]["comments"]["Row"] & {
  author: Database["public"]["Tables"]["user_profiles"]["Row"]
  viewerHasLiked?: boolean
}

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
