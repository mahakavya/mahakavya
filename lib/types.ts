// Enum types
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled"
export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refunded"
export type CampaignStatus = "draft" | "live" | "paused" | "completed"
export type DonationStatus = "created" | "captured" | "failed"
export type SessionStatus = "requested" | "confirmed" | "completed" | "canceled"
export type DrawStatus = "upcoming" | "closed" | "completed"
export type ReportStatus = "open" | "reviewing" | "resolved" | "rejected"

// Core types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  location: string | null
  created_at: string
  updated_at: string
  subscription_status: string | null
  subscription_id: string | null
  plan_id: string | null
  trial_ends_at: string | null
  is_admin: boolean
  referral_code: string | null
  referred_by: string | null
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  subscription_id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  intro_used: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  order_id: string
  payment_id: string | null
  amount: number
  currency: string
  status: string
  kind: string
  meta: any | null
  created_at: string
  updated_at: string
}

export interface FeatureAccess {
  user_id: string
  can_feed: boolean
  can_reels: boolean
  can_luckydraw: boolean
  can_fundraising: boolean
  can_emotional: boolean
  can_messaging: boolean
  updated_at: string
}

// Feed types
export interface Post {
  id: string
  user_id: string
  content: string
  media_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

export interface PostLike {
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
}

// Feed-specific types
export interface FeedPost {
  id: string
  content: string
  media_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  viewerLike?: boolean
}

export interface Follow {
  follower_id: string
  followee_id: string
  created_at: string
}

// Recommendations type
export type ForYouItem = {
  id: string
  author_id: string
  body: string | null
  media_urls: string[] | null
  tags: string[] | null
  created_at: string
  like_count: number
  comment_count: number
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  explain: {
    sRec: number
    sEng: number
    sFol: number
    sTag: number
    score: number
    source?: "ranked" | "fallback"
  }
}

// Reels types
export interface Reel {
  id: string
  author_id: string
  video_url: string
  thumb_url?: string
  caption?: string
  views: number
  likes: number
  created_at: string
}

export interface ReelLike {
  reel_id: string
  user_id: string
  created_at: string
}

// Messaging types
export interface Conversation {
  id: string
  title?: string
  is_group: boolean
  created_by: string
  created_at: string
}

export interface ConversationMember {
  conversation_id: string
  user_id: string
  role: string
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  attachments?: string[]
  session_id?: string
  created_at: string
}

export interface Presence {
  user_id: string
  last_seen: string
  is_typing: boolean
}

// Fundraising types
export interface Campaign {
  id: string
  owner_id: string
  title: string
  description?: string
  goal_amount: number
  raised_amount: number
  cover_url?: string
  status: string
  created_at: string
}

export interface Donation {
  id: string
  campaign_id: string
  user_id: string
  amount: number
  currency: string
  payment_id?: string
  status: string
  created_at: string
}

// Emotional Support types
export interface Listener {
  user_id: string
  bio?: string
  expertise?: string[]
  rating: number
  is_active: boolean
  created_at: string
}

export interface Slot {
  id: string
  listener_id: string
  start_at: string
  end_at: string
  is_booked: boolean
  created_at: string
}

export interface Session {
  id: string
  listener_id: string
  seeker_id: string
  slot_id?: string
  status: string
  created_at: string
}

// Lucky Draw types
export interface Draw {
  id: string
  title: string
  draw_at: string
  ticket_price: number
  status: string
  seed?: string
  result?: any
  created_at: string
}

export interface Entry {
  draw_id: string
  user_id: string
  created_at: string
}

// Admin/Moderation types
export interface Report {
  id: string
  entity_type: string
  entity_id: string
  reporter_id: string
  reason: string
  status: string
  created_at: string
}

// Analytics types
export interface EventLog {
  id: string
  user_id?: string
  name: string
  props?: any
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity: string
  entity_id?: string
  meta?: any
  created_at: string
}

// API Response types
export interface FeedResponse {
  items: FeedPost[]
  nextCursor?: string
  hasMore: boolean
}

export interface LikeToggleResponse {
  liked: boolean
  count: number
}

export interface CommentResponse {
  comment: {
    id: string
    body: string
    created_at: string
    updated_at: string
    author: {
      id: string
      name: string
      avatar_url?: string
    }
  }
}

// Database response types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          subscription_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          intro_used: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          subscription_id: string
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          intro_used?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          subscription_id?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          intro_used?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string
          payment_id: string | null
          amount: number
          currency: string
          status: string
          kind: string
          meta: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          payment_id?: string | null
          amount: number
          currency: string
          status: string
          kind: string
          meta?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string
          payment_id?: string | null
          amount?: number
          currency?: string
          status?: string
          kind?: string
          meta?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      feature_access: {
        Row: {
          user_id: string
          can_feed: boolean
          can_reels: boolean
          can_luckydraw: boolean
          can_fundraising: boolean
          can_emotional: boolean
          can_messaging: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          can_feed?: boolean
          can_reels?: boolean
          can_luckydraw?: boolean
          can_fundraising?: boolean
          can_emotional?: boolean
          can_messaging?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          can_feed?: boolean
          can_reels?: boolean
          can_luckydraw?: boolean
          can_fundraising?: boolean
          can_emotional?: boolean
          can_messaging?: boolean
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          media_url: string | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          media_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          media_url?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          owner_id: string
          title: string
          description?: string
          goal_amount: number
          raised_amount: number
          cover_url?: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string
          goal_amount: number
          raised_amount?: number
          cover_url?: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string
          goal_amount?: number
          raised_amount?: number
          cover_url?: string
          status?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          kind: string
          title: string
          body: string
          href: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: string
          title: string
          body: string
          href?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          title?: string
          body?: string
          href?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
