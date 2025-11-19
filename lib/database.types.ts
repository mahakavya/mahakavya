export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
          likes_count: number
          comments_count: number
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
          likes_count?: number
          comments_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
          likes_count?: number
          comments_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_id: string | null
          content: string
          like_count: number
          reply_count: number
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_id?: string | null
          content: string
          like_count?: number
          reply_count?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          like_count?: number
          reply_count?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          participants: string[]
          last_message_id: string | null
          last_message_at: string | null
          is_group: boolean
          group_name: string | null
          group_avatar: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participants: string[]
          last_message_id?: string | null
          last_message_at?: string | null
          is_group?: boolean
          group_name?: string | null
          group_avatar?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participants?: string[]
          last_message_id?: string | null
          last_message_at?: string | null
          is_group?: boolean
          group_name?: string | null
          group_avatar?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: string
          media_url: string | null
          reply_to: string | null
          is_edited: boolean
          is_deleted: boolean
          read_by: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: string
          media_url?: string | null
          reply_to?: string | null
          is_edited?: boolean
          is_deleted?: boolean
          read_by?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: string
          media_url?: string | null
          reply_to?: string | null
          is_edited?: boolean
          is_deleted?: boolean
          read_by?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          goal_amount: number
          raised_amount: number
          image_url: string | null
          status: string
          created_at: string
          updated_at: string
          end_date: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          goal_amount: number
          raised_amount?: number
          image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          end_date: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          goal_amount?: number
          raised_amount?: number
          image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          end_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          id: string
          campaign_id: string
          donor_id: string | null
          amount: number
          currency: string
          payment_method: string
          payment_id: string | null
          status: string
          is_anonymous: boolean
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          donor_id?: string | null
          amount: number
          currency?: string
          payment_method: string
          payment_id?: string | null
          status?: string
          is_anonymous?: boolean
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          donor_id?: string | null
          amount?: number
          currency?: string
          payment_method?: string
          payment_id?: string | null
          status?: string
          is_anonymous?: boolean
          message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          id: string
          user_id: string
          title: string | null
          description: string | null
          video_url: string
          thumbnail_url: string | null
          duration: number
          hashtags: string[] | null
          mentions: string[] | null
          like_count: number
          comment_count: number
          share_count: number
          view_count: number
          is_featured: boolean
          visibility: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          description?: string | null
          video_url: string
          thumbnail_url?: string | null
          duration: number
          hashtags?: string[] | null
          mentions?: string[] | null
          like_count?: number
          comment_count?: number
          share_count?: number
          view_count?: number
          is_featured?: boolean
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          description?: string | null
          video_url?: string
          thumbnail_url?: string | null
          duration?: number
          hashtags?: string[] | null
          mentions?: string[] | null
          like_count?: number
          comment_count?: number
          share_count?: number
          view_count?: number
          is_featured?: boolean
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          prize_description: string
          entry_fee: number
          currency: string
          max_participants: number | null
          current_participants: number
          status: string
          draw_date: string
          winner_id: string | null
          prize_image: string | null
          rules: string | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          prize_description: string
          entry_fee: number
          currency?: string
          max_participants?: number | null
          current_participants?: number
          status?: string
          draw_date: string
          winner_id?: string | null
          prize_image?: string | null
          rules?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          prize_description?: string
          entry_fee?: number
          currency?: string
          max_participants?: number | null
          current_participants?: number
          status?: string
          draw_date?: string
          winner_id?: string | null
          prize_image?: string | null
          rules?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draws_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_entries: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          entry_number: number
          payment_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          entry_number: number
          payment_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          draw_id?: string
          user_id?: string
          entry_number?: number
          payment_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_entries_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listeners: {
        Row: {
          id: string
          user_id: string
          specializations: string[]
          languages: string[]
          availability_hours: Json
          hourly_rate: number | null
          currency: string
          bio: string | null
          experience_years: number | null
          certifications: string[] | null
          rating: number
          total_sessions: number
          is_verified: boolean
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specializations: string[]
          languages: string[]
          availability_hours: Json
          hourly_rate?: number | null
          currency?: string
          bio?: string | null
          experience_years?: number | null
          certifications?: string[] | null
          rating?: number
          total_sessions?: number
          is_verified?: boolean
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specializations?: string[]
          languages?: string[]
          availability_hours?: Json
          hourly_rate?: number | null
          currency?: string
          bio?: string | null
          experience_years?: number | null
          certifications?: string[] | null
          rating?: number
          total_sessions?: number
          is_verified?: boolean
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listeners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          listener_id: string
          client_id: string
          status: string
          scheduled_at: string | null
          started_at: string | null
          ended_at: string | null
          duration_minutes: number | null
          session_type: string
          notes: string | null
          rating: number | null
          feedback: string | null
          amount: number | null
          currency: string
          payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listener_id: string
          client_id: string
          status?: string
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
          duration_minutes?: number | null
          session_type: string
          notes?: string | null
          rating?: number | null
          feedback?: string | null
          amount?: number | null
          currency?: string
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listener_id?: string
          client_id?: string
          status?: string
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
          duration_minutes?: number | null
          session_type?: string
          notes?: string | null
          rating?: number | null
          feedback?: string | null
          amount?: number | null
          currency?: string
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_listener_id_fkey"
            columns: ["listener_id"]
            isOneToOne: false
            referencedRelation: "listeners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
