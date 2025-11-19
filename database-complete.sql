-- =====================================================
-- MAHAKAVYA SOCIAL PLATFORM - COMPLETE DATABASE SETUP
-- =====================================================
-- This file contains all database schema, functions, triggers, 
-- policies, indexes, and sample data for the platform.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- MIGRATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- =====================================================
-- CORE TABLES
-- =====================================================

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
  is_verified BOOLEAN DEFAULT FALSE,
  shadow_muted BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature access table
CREATE TABLE IF NOT EXISTS feature_access (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  has_access BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, feature_name)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  intro_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT NOT NULL,
  payment_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  kind TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SOCIAL FEED TABLES (SAMVAAHA)
-- =====================================================

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  tags TEXT[],
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

-- =====================================================
-- REELS TABLES (DRISHYA)
-- =====================================================

-- Reels table
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumb_url TEXT,
  caption TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reel likes table
CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

-- Reel views table
CREATE TABLE IF NOT EXISTS reel_views (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  view_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

-- =====================================================
-- MESSAGING TABLES (VARTA)
-- =====================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation members table
CREATE TABLE IF NOT EXISTS conversation_members (
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
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[],
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presence table for typing indicators
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_typing BOOLEAN DEFAULT FALSE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, conversation_id)
);

-- =====================================================
-- FUNDRAISING TABLES (NIVEDANA)
-- =====================================================

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount INTEGER NOT NULL CHECK (goal_amount > 0),
  raised_amount INTEGER DEFAULT 0 CHECK (raised_amount >= 0),
  cover_url TEXT,
  category TEXT DEFAULT 'other',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused', 'completed', 'cancelled')),
  end_date TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EMOTIONAL SUPPORT TABLES (SAHAYA)
-- =====================================================

-- Listeners table
CREATE TABLE IF NOT EXISTS listeners (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT NOT NULL,
  expertise TEXT[] NOT NULL,
  languages TEXT[] NOT NULL,
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slots table
CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_at > start_at)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  topic TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LUCKY DRAWS TABLES (BHAGYACHAKRA)
-- =====================================================

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize_description TEXT,
  prize_value DECIMAL(10,2),
  draw_at TIMESTAMPTZ NOT NULL,
  ticket_price INTEGER DEFAULT 0 CHECK (ticket_price >= 0),
  max_entries INTEGER,
  entry_cost DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  seed TEXT,
  result JSONB,
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draw entries table
CREATE TABLE IF NOT EXISTS entries (
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entries_count INTEGER DEFAULT 1 CHECK (entries_count > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (draw_id, user_id)
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
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

-- Push tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS AND MONITORING
-- =====================================================

-- Events table for analytics
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  props JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT MODERATION
-- =====================================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'reel', 'user', 'campaign')),
  entity_id UUID NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety flags table
CREATE TABLE IF NOT EXISTS safety_flags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  flag_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3,2) DEFAULT 0.5,
  details JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RATE LIMITING
-- =====================================================

-- Rate events table
CREATE TABLE IF NOT EXISTS rate_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip INET,
  route TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REFERRALS AND REWARDS
-- =====================================================

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

-- Referral credits table
CREATE TABLE IF NOT EXISTS referral_credits (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- UTILITY TABLES
-- =====================================================

-- Document counters table
CREATE TABLE IF NOT EXISTS doc_counters (
  doc_type TEXT NOT NULL,
  period TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (doc_type, period)
);

-- Delete requests table
CREATE TABLE IF NOT EXISTS delete_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content management tables
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('post', 'reel', 'comment')),
  content_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content_text TEXT,
  media_urls TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_score DECIMAL(3,2) DEFAULT 0.00,
  blockchain_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Results
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  toxicity_score DECIMAL(3,2) DEFAULT 0.00,
  sentiment_score DECIMAL(3,2) DEFAULT 0.00,
  category VARCHAR(50),
  confidence DECIMAL(3,2) DEFAULT 0.00,
  flags TEXT[],
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain Verification
CREATE TABLE IF NOT EXISTS blockchain_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  transaction_hash VARCHAR(66),
  block_number BIGINT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  integrity_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPA Automation Jobs
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  parameters JSONB,
  results JSONB,
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Moderation Actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  moderator_id UUID REFERENCES profiles(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'hide', 'delete')),
  reason TEXT,
  automated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Feature access indexes
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_feature_name ON feature_access(feature_name);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING GIN(to_tsvector('english', content));

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);

-- Comment likes indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee_id ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_featured ON campaigns(is_featured);
CREATE INDEX IF NOT EXISTS idx_campaigns_search ON campaigns USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- Draws indexes
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_draws_draw_at ON draws(draw_at);
CREATE INDEX IF NOT EXISTS idx_draws_created_at ON draws(created_at);

-- Draw entries indexes
CREATE INDEX IF NOT EXISTS idx_entries_draw_id ON entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);

-- Reels indexes
CREATE INDEX IF NOT EXISTS idx_reels_author_id ON reels(author_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_is_hidden ON reels(is_hidden);
CREATE INDEX IF NOT EXISTS idx_reels_views ON reels(views DESC);
CREATE INDEX IF NOT EXISTS idx_reels_likes ON reels(likes DESC);

-- Reel likes indexes
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user_id ON reel_likes(user_id);

-- Reel views indexes
CREATE INDEX IF NOT EXISTS idx_reel_views_reel_id ON reel_views(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_views_user_id ON reel_views(user_id);
CREATE INDEX IF NOT EXISTS idx_reel_views_created_at ON reel_views(created_at);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Conversation members indexes
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Sahaya listeners indexes
CREATE INDEX IF NOT EXISTS idx_listeners_is_active ON listeners(is_active);
CREATE INDEX IF NOT EXISTS idx_listeners_is_verified ON listeners(is_verified);
CREATE INDEX IF NOT EXISTS idx_listeners_rating ON listeners(rating DESC);
CREATE INDEX IF NOT EXISTS idx_listeners_expertise ON listeners USING GIN(expertise);
CREATE INDEX IF NOT EXISTS idx_listeners_languages ON listeners USING GIN(languages);

-- Sahaya sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_listener_id ON sessions(listener_id);
CREATE INDEX IF NOT EXISTS idx_sessions_seeker_id ON sessions(seeker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_kind ON notifications(kind);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_entity_type ON reports(entity_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Referrals indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Content management indexes
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_risk_level ON content_items(risk_level);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_content_item ON ai_analysis(content_item_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_content_item ON blockchain_records(content_item_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON reels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listeners_updated_at BEFORE UPDATE ON listeners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Grant basic feature access
    INSERT INTO feature_access (user_id, feature_name, has_access)
    VALUES 
        (NEW.id, 'posts', true),
        (NEW.id, 'comments', true),
        (NEW.id, 'messaging', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for post likes count
CREATE TRIGGER post_likes_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for post comments count
CREATE TRIGGER post_comments_count_trigger
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for comment likes count
CREATE TRIGGER comment_likes_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Function to update campaign raised amount
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount - OLD.amount WHERE id = OLD.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount - OLD.amount WHERE id = OLD.campaign_id;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for campaign raised amount
CREATE TRIGGER campaign_raised_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_campaign_raised_amount();

-- Function to update reel likes count
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reels SET likes = likes + 1 WHERE id = NEW.reel_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reels SET likes = likes - 1 WHERE id = OLD.reel_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for reel likes count
CREATE TRIGGER reel_likes_count_trigger
    AFTER INSERT OR DELETE ON reel_likes
    FOR EACH ROW EXECUTE FUNCTION update_reel_likes_count();

-- Function to update reel views count
CREATE OR REPLACE FUNCTION update_reel_views_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reels SET views = views + 1 WHERE id = NEW.reel_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for reel views count
CREATE TRIGGER reel_views_count_trigger
    AFTER INSERT ON reel_views
    FOR EACH ROW EXECUTE FUNCTION update_reel_views_count();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to set referral code on profile creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set referral code
CREATE TRIGGER set_referral_code_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_kind TEXT,
    p_title TEXT,
    p_body TEXT,
    p_href TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, kind, title, body, href, data)
    VALUES (p_user_id, p_kind, p_title, p_body, p_href, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(
    search_query TEXT,
    content_type TEXT DEFAULT 'all',
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    author_name TEXT,
    created_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    IF content_type = 'posts' OR content_type = 'all' THEN
        RETURN QUERY
        SELECT 
            p.id,
            'post'::TEXT as type,
            substring(p.content from 1 for 100) as title,
            p.content,
            pr.name as author_name,
            p.created_at,
            ts_rank(to_tsvector('english', p.content), plainto_tsquery('english', search_query)) as rank
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        WHERE to_tsvector('english', p.content) @@ plainto_tsquery('english', search_query)
        AND NOT p.is_hidden
        ORDER BY rank DESC
        LIMIT limit_count;
    END IF;
    
    IF content_type = 'campaigns' OR content_type = 'all' THEN
        RETURN QUERY
        SELECT 
            c.id,
            'campaign'::TEXT as type,
            c.title,
            c.description as content,
            pr.name as author_name,
            c.created_at,
            ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', search_query)) as rank
        FROM campaigns c
        JOIN profiles pr ON c.owner_id = pr.id
        WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', search_query)
        AND c.status = 'live'
        ORDER BY rank DESC
        LIMIT limit_count;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup admin user
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Check if user exists and get their ID
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = admin_email), id 
    INTO user_exists, user_id
    FROM profiles 
    WHERE email = admin_email;
    
    IF user_exists THEN
        -- Update user to admin
        UPDATE profiles 
        SET 
            is_admin = true,
            role = 'admin',
            is_verified = true,
            updated_at = NOW()
        WHERE email = admin_email;
        
        -- Grant all feature access to admin
        INSERT INTO feature_access (user_id, feature_name, has_access, granted_at)
        SELECT 
            user_id,
            feature_name,
            true,
            NOW()
        FROM (
            VALUES 
                ('posts'),
                ('comments'),
                ('messaging'),
                ('campaigns'),
                ('draws'),
                ('reels'),
                ('sahaya'),
                ('analytics'),
                ('admin_panel')
        ) AS features(feature_name)
        ON CONFLICT (user_id, feature_name) 
        DO UPDATE SET 
            has_access = true,
            granted_at = NOW();
        
        -- Log the admin setup
        INSERT INTO events (user_id, name, props)
        VALUES (
            user_id,
            'admin_setup',
            jsonb_build_object(
                'admin_email', admin_email,
                'setup_at', NOW()
            )
        );
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle post like (atomic operation)
CREATE OR REPLACE FUNCTION toggle_post_like(post_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  like_exists BOOLEAN;
  new_count INTEGER;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid
  ) INTO like_exists;
  
  IF like_exists THEN
    -- Remove like
    DELETE FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid;
    
    -- Update count
    UPDATE posts 
    SET likes_count = likes_count - 1 
    WHERE id = post_uuid
    RETURNING likes_count INTO new_count;
    
    RETURN json_build_object('liked', false, 'count', new_count);
  ELSE
    -- Add like
    INSERT INTO post_likes (post_id, user_id) 
    VALUES (post_uuid, user_uuid);
    
    -- Update count
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = post_uuid
    RETURNING likes_count INTO new_count;
    
    RETURN json_build_object('liked', true, 'count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle reel like (atomic operation)
CREATE OR REPLACE FUNCTION toggle_reel_like(reel_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  like_exists BOOLEAN;
  new_count INTEGER;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM reel_likes 
    WHERE reel_id = reel_uuid AND user_id = user_uuid
  ) INTO like_exists;
  
  IF like_exists THEN
    -- Remove like
    DELETE FROM reel_likes 
    WHERE reel_id = reel_uuid AND user_id = user_uuid;
    
    -- Update count
    UPDATE reels 
    SET likes = likes - 1 
    WHERE id = reel_uuid
    RETURNING likes INTO new_count;
    
    RETURN json_build_object('liked', false, 'count', new_count);
  ELSE
    -- Add like
    INSERT INTO reel_likes (reel_id, user_id) 
    VALUES (reel_uuid, user_uuid);
    
    -- Update count
    UPDATE reels 
    SET likes = likes + 1 
    WHERE id = reel_uuid
    RETURNING likes INTO new_count;
    
    RETURN json_build_object('liked', true, 'count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register reel view (idempotent)
CREATE OR REPLACE FUNCTION register_reel_view(reel_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  view_exists BOOLEAN;
  new_count INTEGER;
BEGIN
  -- Check if view already exists
  SELECT EXISTS(
    SELECT 1 FROM reel_views 
    WHERE reel_id = reel_uuid AND user_id = user_uuid
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    -- Insert new view
    INSERT INTO reel_views (reel_id, user_id) 
    VALUES (reel_uuid, user_uuid);
    
    -- Update view count
    UPDATE reels 
    SET views = views + 1 
    WHERE id = reel_uuid
    RETURNING views INTO new_count;
    
    RETURN json_build_object('viewed', true, 'count', new_count);
  ELSE
    -- Return existing count
    SELECT views INTO new_count FROM reels WHERE id = reel_uuid;
    RETURN json_build_object('viewed', false, 'count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower_uuid UUID, followee_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = follower_uuid AND followee_id = followee_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Slot overlap prevention for Sahaya
CREATE OR REPLACE FUNCTION check_slot_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM slots 
    WHERE listener_id = NEW.listener_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (
      (NEW.start_at >= start_at AND NEW.start_at < end_at) OR
      (NEW.end_at > start_at AND NEW.end_at <= end_at) OR
      (NEW.start_at <= start_at AND NEW.end_at >= end_at)
    )
  ) THEN
    RAISE EXCEPTION 'Slot overlaps with existing slot for this listener';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_slot_overlap
  BEFORE INSERT OR UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION check_slot_overlap();

-- Draw closing function
CREATE OR REPLACE FUNCTION close_draw(p_draw UUID, p_closed_at TIMESTAMPTZ)
RETURNS VOID
LANGUAGE SQL AS $$
  UPDATE draws 
    SET status = 'closed',
        result = COALESCE(result, '{}'::JSONB) || jsonb_build_object('closed_at', p_closed_at)
  WHERE id = p_draw AND status = 'upcoming';
$$;

-- Campaign fundraising increment
CREATE OR REPLACE FUNCTION inc_campaign_raised(p_campaign UUID, p_amount INT)
RETURNS VOID
LANGUAGE SQL AS $$
  UPDATE campaigns SET raised_amount = raised_amount + p_amount
  WHERE id = p_campaign;
$$;

-- Document counter increment
CREATE OR REPLACE FUNCTION doc_counter_inc(p_doc TEXT, p_period TEXT)
RETURNS TABLE(num INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to increment existing counter
  UPDATE doc_counters 
  SET counter = counter + 1 
  WHERE doc_type = p_doc AND period = p_period;
  
  IF FOUND THEN
    RETURN QUERY SELECT counter FROM doc_counters 
    WHERE doc_type = p_doc AND period = p_period;
  ELSE
    -- Insert new counter starting at 1
    INSERT INTO doc_counters (doc_type, period, counter) 
    VALUES (p_doc, p_period, 1);
    RETURN QUERY SELECT 1 AS num;
  END IF;
END;
$$;

-- Referral credits increment
CREATE OR REPLACE FUNCTION increment_referral_credits(p_user_id UUID, p_days INT)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO referral_credits (user_id, days, updated_at)
  VALUES (p_user_id, p_days, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    days = referral_credits.days + p_days,
    updated_at = NOW();
$$;

-- Function to update presence timestamp
CREATE OR REPLACE FUNCTION update_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_presence_timestamp_trigger
  BEFORE UPDATE ON presence
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_timestamp();

-- Function to update content item timestamp
CREATE OR REPLACE FUNCTION update_content_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_items_timestamp
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_item_timestamp();

-- Function to get content statistics
CREATE OR REPLACE FUNCTION get_content_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'flagged', COUNT(*) FILTER (WHERE status = 'flagged'),
    'riskDistribution', json_build_object(
      'low', COUNT(*) FILTER (WHERE risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE risk_level = 'critical')
    ),
    'processingTime', 1.2
  ) INTO result
  FROM content_items;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to moderate content
CREATE OR REPLACE FUNCTION moderate_content(
  p_content_id UUID,
  p_moderator_id UUID,
  p_action VARCHAR(20),
  p_reason TEXT DEFAULT NULL,
  p_automated BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update content status
  UPDATE content_items 
  SET status = CASE 
    WHEN p_action = 'approve' THEN 'approved'
    WHEN p_action = 'reject' THEN 'rejected'
    WHEN p_action = 'flag' THEN 'flagged'
    ELSE status
  END,
  updated_at = NOW()
  WHERE id = p_content_id;
  
  -- Insert moderation action
  INSERT INTO moderation_actions (content_item_id, moderator_id, action, reason, automated)
  VALUES (p_content_id, p_moderator_id, p_action, p_reason, p_automated);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk moderate content
CREATE OR REPLACE FUNCTION bulk_moderate_content(
  p_content_ids UUID[],
  p_moderator_id UUID,
  p_action VARCHAR(20),
  p_reason TEXT DEFAULT NULL,
  p_automated BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  content_id UUID;
BEGIN
  FOREACH content_id IN ARRAY p_content_ids
  LOOP
    BEGIN
      PERFORM moderate_content(content_id, p_moderator_id, p_action, p_reason, p_automated);
      success_count := success_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', success_count,
    'failed', error_count,
    'total', array_length(p_content_ids, 1)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE delete_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Feature access policies
CREATE POLICY "Users can view their own feature access" ON feature_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feature access" ON feature_access FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage feature access" ON feature_access FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage any post" ON posts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Post likes policies
CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON post_comments FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Authenticated users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage any comment" ON post_comments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Comment likes policies
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Campaigns policies
CREATE POLICY "Live campaigns are viewable by everyone" ON campaigns FOR SELECT USING (status = 'live' OR auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage any campaign" ON campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Donations policies
CREATE POLICY "Donations are viewable by campaign owner and donor" ON donations FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT owner_id FROM campaigns WHERE id = campaign_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated users can donate" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Draws policies
CREATE POLICY "Draws are viewable by everyone" ON draws FOR SELECT USING (true);
CREATE POLICY "Admins can manage draws" ON draws FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Draw entries policies
CREATE POLICY "Draw entries are viewable by everyone" ON entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can enter draws" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own entries" ON entries FOR SELECT USING (auth.uid() = user_id);

-- Reels policies
CREATE POLICY "Reels are viewable by everyone" ON reels FOR SELECT USING (NOT is_hidden OR auth.uid() = author_id);
CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own reels" ON reels FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own reels" ON reels FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage any reel" ON reels FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Reel likes policies
CREATE POLICY "Reel likes are viewable by everyone" ON reel_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like reels" ON reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own reel likes" ON reel_likes FOR DELETE USING (auth.uid() = user_id);

-- Reel views policies
CREATE POLICY "Reel views are viewable by reel author" ON reel_views FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT author_id FROM reels WHERE id = reel_id)
);
CREATE POLICY "Authenticated users can record reel views" ON reel_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation members policies
CREATE POLICY "Users can view participants of their conversations" ON conversation_members FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Conversation creators can add participants" ON conversation_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND created_by = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Presence policies
CREATE POLICY "Users can view presence in their conversations" ON presence FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_members cm
        WHERE cm.conversation_id = presence.conversation_id
        AND cm.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update their own presence" ON presence FOR ALL USING (user_id = auth.uid());

-- Sahaya listeners policies
CREATE POLICY "Listeners are viewable by everyone" ON listeners FOR SELECT USING (is_active = true);
CREATE POLICY "Users can register as listeners" ON listeners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their listener profile" ON listeners FOR UPDATE USING (auth.uid() = user_id);

-- Sahaya sessions policies
CREATE POLICY "Users can view their own sessions" ON sessions FOR SELECT USING (
    auth.uid() = listener_id OR auth.uid() = seeker_id
);
CREATE POLICY "Users can create sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "Listeners can update their sessions" ON sessions FOR UPDATE USING (auth.uid() = listener_id);

-- Slots policies
CREATE POLICY "Slots are viewable by everyone" ON slots FOR SELECT USING (true);
CREATE POLICY "Listeners can manage their slots" ON slots FOR ALL USING (
    EXISTS (SELECT 1 FROM listeners WHERE user_id = auth.uid() AND user_id = slots.listener_id)
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can manage their notification preferences" ON notification_prefs FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Push tokens policies
CREATE POLICY "Users can manage their push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "Admins can view all analytics" ON events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "System can insert analytics events" ON events FOR INSERT WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Safety flags policies
CREATE POLICY "Admins can manage safety flags" ON safety_flags FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Rate events policies
CREATE POLICY "Admins can view rate events" ON rate_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Referrals policies
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referee_id
);
CREATE POLICY "System can manage referrals" ON referrals FOR ALL WITH CHECK (true);

-- Referral credits policies
CREATE POLICY "Users can view their own referral credits" ON referral_credits FOR SELECT USING (auth.uid() = user_id);

-- Doc counters policies
CREATE POLICY "Admins can view doc counters" ON doc_counters FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Delete requests policies
CREATE POLICY "Users can manage their delete requests" ON delete_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all delete requests" ON delete_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Content items policies
CREATE POLICY "Users can view all content items" ON content_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage content items" ON content_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users can insert their own content" ON content_items FOR INSERT WITH CHECK (
    author_id = auth.uid()
);

-- AI analysis policies
CREATE POLICY "Users can view AI analysis" ON ai_analysis FOR SELECT USING (true);
CREATE POLICY "Admins can manage AI analysis" ON ai_analysis FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Blockchain records policies
CREATE POLICY "Users can view blockchain records" ON blockchain_records FOR SELECT USING (true);
CREATE POLICY "Admins can manage blockchain records" ON blockchain_records FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Automation jobs policies
CREATE POLICY "Admins can manage automation jobs" ON automation_jobs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Moderation actions policies
CREATE POLICY "Users can view moderation actions" ON moderation_actions FOR SELECT USING (true);
CREATE POLICY "Admins can manage moderation actions" ON moderation_actions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- VIEWS AND MATERIALIZED VIEWS
-- =====================================================

-- Create view for content with analysis
CREATE OR REPLACE VIEW content_with_analysis AS
SELECT 
  ci.*,
  aa.toxicity_score,
  aa.sentiment_score,
  aa.category,
  aa.confidence,
  aa.flags,
  aa.recommendations,
  br.transaction_hash,
  br.verification_status,
  br.integrity_hash,
  p.name as author_name,
  p.avatar_url as author_avatar
FROM content_items ci
LEFT JOIN ai_analysis aa ON ci.id = aa.content_item_id
LEFT JOIN blockchain_records br ON ci.id = br.content_item_id
LEFT JOIN profiles p ON ci.author_id = p.id;

-- Profile stats view
CREATE OR REPLACE VIEW profile_stats AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  COALESCE(follower_counts.count, 0) as followers_count,
  COALESCE(following_counts.count, 0) as following_count,
  COALESCE(post_counts.count, 0) as posts_count
FROM profiles p
LEFT JOIN (
  SELECT followee_id, COUNT(*) as count
  FROM follows
  GROUP BY followee_id
) follower_counts ON p.id = follower_counts.followee_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM follows
  GROUP BY follower_id
) following_counts ON p.id = following_counts.follower_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  WHERE NOT is_hidden
  GROUP BY user_id
) post_counts ON p.id = post_counts.user_id;

-- Create materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS content_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  type,
  status,
  risk_level,
  COUNT(*) as count,
  AVG(ai_score) as avg_ai_score
FROM content_items
GROUP BY DATE_TRUNC('day', created_at), type, status, risk_level;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_analytics_unique 
ON content_analytics(date, type, status, risk_level);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_content_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY content_analytics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION setup_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION search_content(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_like(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_reel_like(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION register_reel_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_following(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION close_draw(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION inc_campaign_raised(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION doc_counter_inc(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_referral_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION moderate_content(UUID, UUID, VARCHAR, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_moderate_content(UUID[], UUID, VARCHAR, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_content_analytics() TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON content_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blockchain_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON moderation_actions TO authenticated;
GRANT SELECT ON content_with_analysis TO authenticated;
GRANT SELECT ON profile_stats TO authenticated;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample lucky draws
INSERT INTO draws (id, title, description, prize_description, prize_value, max_entries, entry_cost, status, start_date, end_date) VALUES
(
    uuid_generate_v4(),
    'Weekly Smartphone Giveaway',
    'Win the latest smartphone in our weekly lucky draw! Entry is free for all registered users.',
    'Latest Android Smartphone (64GB)',
    25000.00,
    1000,
    0.00,
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days'
),
(
    uuid_generate_v4(),
    'Monthly Laptop Prize',
    'Premium laptop giveaway for our community members. Small entry fee helps maintain the platform.',
    'Gaming Laptop (16GB RAM, 512GB SSD)',
    75000.00,
    500,
    100.00,
    'upcoming',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '37 days'
),
(
    uuid_generate_v4(),
    'Festival Special - Gold Coin',
    'Celebrate the festival season with a chance to win gold coins!',
    '10 Gram Gold Coin',
    50000.00,
    2000,
    50.00,
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '4 days'
);

-- Insert sample content items for testing
INSERT INTO content_items (type, content_id, author_id, content_text, media_urls, status, risk_level, ai_score) 
SELECT 
    'post',
    uuid_generate_v4(),
    p.id,
    'Beautiful sunset at the beach today! #nature #photography #blessed',
    ARRAY['/beach-sunset.png'],
    'approved',
    'low',
    0.15
FROM profiles p LIMIT 1;

INSERT INTO content_items (type, content_id, author_id, content_text, status, risk_level, ai_score)
SELECT 
    'post',
    uuid_generate_v4(),
    p.id,
    'Sharing some wisdom from ancient Sanskrit texts. Knowledge is the greatest wealth. 📚✨',
    'approved',
    'low',
    0.05
FROM profiles p LIMIT 1;

-- Insert sample AI analysis data
INSERT INTO ai_analysis (content_item_id, toxicity_score, sentiment_score, category, confidence, flags, recommendations)
SELECT 
  id,
  CASE 
    WHEN risk_level = 'low' THEN 0.1
    WHEN risk_level = 'medium' THEN 0.4
    WHEN risk_level = 'high' THEN 0.8
    ELSE 0.9
  END,
  CASE 
    WHEN risk_level = 'low' THEN 0.7
    WHEN risk_level = 'medium' THEN 0.2
    WHEN risk_level = 'high' THEN -0.5
    ELSE -0.8
  END,
  CASE 
    WHEN risk_level = 'low' THEN 'positive'
    WHEN risk_level = 'medium' THEN 'neutral'
    WHEN risk_level = 'high' THEN 'spam'
    ELSE 'scam'
  END,
  CASE 
    WHEN risk_level = 'low' THEN 0.9
    WHEN risk_level = 'medium' THEN 0.7
    WHEN risk_level = 'high' THEN 0.85
    ELSE 0.95
  END,
  CASE 
    WHEN risk_level = 'low' THEN ARRAY['positive_content']
    WHEN risk_level = 'medium' THEN ARRAY['needs_review']
    WHEN risk_level = 'high' THEN ARRAY['spam', 'suspicious_links']
    ELSE ARRAY['scam', 'financial_fraud', 'urgent_action_required']
  END,
  CASE 
    WHEN risk_level = 'low' THEN 'Content meets community guidelines'
    WHEN risk_level = 'medium' THEN 'Monitor for engagement patterns'
    WHEN risk_level = 'high' THEN 'Requires immediate manual review'
    ELSE 'Block immediately and investigate user'
  END
FROM content_items;

-- Insert sample blockchain records
INSERT INTO blockchain_records (content_item_id, transaction_hash, block_number, verification_status, integrity_hash)
SELECT 
  id,
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000000 + floor(random() * 100000)::int,
  'verified',
  encode(gen_random_bytes(32), 'hex')
FROM content_items;

-- Insert sample automation jobs
INSERT INTO automation_jobs (job_type, status, parameters, results, progress, started_at, completed_at) VALUES
('bulk_moderation', 'completed', '{"contentIds": ["sample"], "criteria": {"autoApprove": true}}', '{"processed": 150, "approved": 120, "rejected": 20, "flagged": 10}', 100, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
('content_scan', 'running', '{"filters": {"riskLevel": ["high", "critical"]}}', NULL, 65, NOW() - INTERVAL '30 minutes', NULL),
('duplicate_detection', 'queued', '{"contentType": "post"}', NULL, 0, NULL, NULL);

-- =====================================================
-- MIGRATION TRACKING
-- =====================================================

-- Mark all migrations as applied
INSERT INTO schema_migrations (version, description) VALUES
('001_initial_schema', 'Initial database schema with all tables'),
('002_rls_policies', 'Row Level Security policies'),
('003_indexes', 'Database indexes for performance'),
('004_functions', 'Database functions and triggers'),
('005_seed_data', 'Sample data for testing'),
('006_admin_functions', 'Admin setup and management functions'),
('007_content_management', 'Content management and moderation system'),
('008_complete_setup', 'Complete database setup with all features')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- FINAL SETUP COMPLETE
-- =====================================================

COMMIT;

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'MAHAKAVYA SOCIAL PLATFORM DATABASE SETUP COMPLETE!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'All tables, functions, policies, and sample data have been created.';
    RAISE NOTICE 'The platform is ready for use with all features enabled.';
    RAISE NOTICE '=====================================================';
END $$;
