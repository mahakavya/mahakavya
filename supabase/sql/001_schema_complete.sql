-- Complete database schema for Mahakavya Social Platform
-- This file contains all tables needed for the application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  shadow_muted BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table for social feed
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table (for posts and comments)
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT likes_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Reels table for short videos
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  duration INTEGER, -- in seconds
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reel likes table
CREATE TABLE IF NOT EXISTS reel_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, reel_id)
);

-- Reel views table
CREATE TABLE IF NOT EXISTS reel_views (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  view_duration INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, reel_id)
);

-- Conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[],
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table for fundraising
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount INTEGER NOT NULL,
  raised_amount INTEGER DEFAULT 0,
  cover_image_url TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listeners table for emotional support
CREATE TABLE IF NOT EXISTS listeners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT NOT NULL,
  expertise TEXT[] NOT NULL,
  languages TEXT[] NOT NULL,
  hourly_rate INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  availability_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listener slots table
CREATE TABLE IF NOT EXISTS listener_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Sessions table for emotional support sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES listener_slots(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  message TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draws table for lucky draws
CREATE TABLE IF NOT EXISTS draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize_description TEXT NOT NULL,
  entry_fee INTEGER DEFAULT 0,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  draw_date TIMESTAMPTZ NOT NULL,
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draw entries table
CREATE TABLE IF NOT EXISTS draw_entries (
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entry_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (draw_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table for community events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  description TEXT,
  payment_method TEXT,
  payment_id TEXT UNIQUE,
  order_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  due_date TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation reports table
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety scores table for content moderation
CREATE TABLE IF NOT EXISTS safety_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  score DECIMAL(3,2) NOT NULL,
  categories JSONB,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trending tags table (materialized view data)
CREATE TABLE IF NOT EXISTS trending_tags (
  tag TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  last_used TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions table for recommendations
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

-- Mark this migration as applied
INSERT INTO schema_migrations (version, description) VALUES
('001_schema_complete', 'Complete database schema with all tables')
ON CONFLICT (version) DO NOTHING;
