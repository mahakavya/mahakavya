import { z } from "zod"

// Reel schemas
export const ReelCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  video_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
})

export const ReelLikeSchema = z.object({
  reel_id: z.string().uuid(),
})

export const ReelViewSchema = z.object({
  reel_id: z.string().uuid(),
})

export const ReelsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  user_id: z.string().uuid().optional(),
})

// Listener schemas
export const ListenerCreateSchema = z.object({
  bio: z.string().min(10).max(500),
  specializations: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  experience_years: z.number().min(0).max(50),
  availability: z.object({
    days: z.array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])),
    hours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
  }),
})

export const ListenerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  specialization: z.string().optional(),
  language: z.string().optional(),
})

// Session schemas
export const SessionRequestSchema = z.object({
  listener_id: z.string().uuid(),
  preferred_time: z.string().datetime(),
  topic: z.string().min(5).max(200),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  // Slot ID and optional note are provided by the client when booking
  slotId: z.string().uuid().optional(),
  note: z.string().max(1000).optional(),
})

export const SessionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
})

export const SessionStatusSchema = z.object({
  session_id: z.string().uuid(),
  status: z.enum(["pending", "active", "completed", "cancelled"]),
})

// Slot schemas
export const SlotCreateSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  is_available: z.boolean().default(true),
})

export const SlotsQuerySchema = z.object({
  listener_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// Draw schemas
export const DrawCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  prize_description: z.string().min(1).max(200),
  entry_cost: z.number().min(0),
  max_entries: z.number().min(1),
  draw_date: z.string().datetime(),
  image_url: z.string().url().optional(),
})

export const DrawJoinSchema = z.object({
  draw_id: z.string().uuid(),
  entries: z.number().min(1).default(1),
})

export const DrawResolveSchema = z.object({
  draw_id: z.string().uuid(),
  winner_id: z.string().uuid(),
})

// Search schema
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(["all", "users", "posts", "campaigns", "reels"]).default("all"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// Chat schemas
export const ConversationCreateSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(1),
  title: z.string().max(100).optional(),
  type: z.enum(["direct", "group"]).default("direct"),
})

export const MessageCreateSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  type: z.enum(["text", "image", "file"]).default("text"),
  metadata: z.record(z.any()).optional(),
})

export const ReadMessageSchema = z.object({
  message_id: z.string().uuid(),
})

export const TypingSchema = z.object({
  conversation_id: z.string().uuid(),
  is_typing: z.boolean(),
})

// Follow schema
export const FollowSchema = z.object({
  user_id: z.string().uuid(),
})

// Campaign schemas
export const CampaignCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  goal_amount: z.number().min(100),
  category: z.string().min(1),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  end_date: z.string().datetime(),
  beneficiary_info: z.object({
    name: z.string().min(1),
    contact: z.string().optional(),
    verification_docs: z.array(z.string().url()).optional(),
  }),
})

export const CampaignUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  goal_amount: z.number().min(100).optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  end_date: z.string().datetime().optional(),
})

export const CampaignListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
  sort: z.enum(["recent", "popular", "ending_soon", "goal_amount"]).default("recent"),
})

export const DonationCreateSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().min(10),
  is_anonymous: z.boolean().default(false),
  message: z.string().max(500).optional(),
})
