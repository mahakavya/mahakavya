#!/bin/bash

# Mahakavya Supabase Setup Script
# This script sets up the complete database schema for Mahakavya social platform

set -e

echo "🚀 Setting up Mahakavya Supabase Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it like: export DATABASE_URL='postgresql://postgres:password@db.project.supabase.co:5432/postgres'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql is not installed"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "✅ Environment validated"

# Create the complete schema
echo "📊 Creating complete database schema..."

psql "$DATABASE_URL" << 'EOF'
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE payment_status AS ENUM ('pending', 'captured', 'failed', 'refunded');
CREATE TYPE campaign_status AS ENUM ('draft', 'live', 'paused', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('requested', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE draw_status AS ENUM ('upcoming', 'closed', 'drawn', 'cancelled');
CREATE TYPE referral_status AS ENUM ('claimed', 'qualified', 'rewarded');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE safety_flag_status AS ENUM ('open', 'reviewing', 'dismissed', 'actioned');

-- Core profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    shadow_muted BOOLEAN DEFAULT FALSE,
    subscription_status subscription_status DEFAULT NULL,
    subscription_id TEXT,
    subscription_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    media_urls TEXT[],
    tags TEXT[],
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', unaccent(coalesce(body,'')))) STORED
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, followee_id)
);

-- Reels
CREATE TABLE IF NOT EXISTS reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    duration INTEGER,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', unaccent(coalesce(caption,'')))) STORED
);

-- Reel likes
CREATE TABLE IF NOT EXISTS reel_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reel_id, user_id)
);

-- Reel views
CREATE TABLE IF NOT EXISTS reel_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    watch_duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reel_id, user_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation members
CREATE TABLE IF NOT EXISTS conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presence for typing indicators
CREATE TABLE IF NOT EXISTS presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_typing BOOLEAN DEFAULT FALSE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, conversation_id)
);

-- Fundraising campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_amount BIGINT NOT NULL,
    raised_amount BIGINT DEFAULT 0,
    image_url TEXT,
    status campaign_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', unaccent(coalesce(title,'') || ' ' || coalesce(description,'')))) STORED
);

-- Donations
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    message TEXT,
    status payment_status DEFAULT 'pending',
    payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listeners for support system
CREATE TABLE IF NOT EXISTS listeners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Available slots for listeners
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listener_id UUID REFERENCES listeners(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listener_id UUID REFERENCES listeners(id) ON DELETE CASCADE,
    seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    status session_status DEFAULT 'requested',
    notes TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lucky draws
CREATE TABLE IF NOT EXISTS draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    prize TEXT NOT NULL,
    draw_at TIMESTAMPTZ NOT NULL,
    status draw_status DEFAULT 'upcoming',
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draw entries
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(draw_id, user_id)
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    currency TEXT DEFAULT 'INR',
    status payment_status DEFAULT 'pending',
    payment_id TEXT,
    order_id TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports for content moderation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status report_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety flags for automated moderation
CREATE TABLE IF NOT EXISTS safety_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL,
    score NUMERIC NOT NULL,
    status safety_flag_status DEFAULT 'open',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events for analytics
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    props JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    href TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_prefs (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    email_digest BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    kinds_allowed TEXT[] DEFAULT array[]::TEXT[]
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting events
CREATE TABLE IF NOT EXISTS rate_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    ip TEXT,
    route TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
    code TEXT PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id)
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT REFERENCES referral_codes(code) ON DELETE CASCADE,
    inviter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status referral_status DEFAULT 'claimed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(invitee_id)
);

-- Referral credits
CREATE TABLE IF NOT EXISTS referral_credits (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delete requests for compliance
CREATE TABLE IF NOT EXISTS delete_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    status TEXT CHECK (status IN ('open','in_progress','completed','rejected')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document counters for invoices/receipts
CREATE TABLE IF NOT EXISTS doc_counters (
    id BIGSERIAL PRIMARY KEY,
    doc_type TEXT NOT NULL,
    period TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    UNIQUE (doc_type, period)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tsv ON posts USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS idx_posts_trgm ON posts USING gin (body gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_recent ON post_likes(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_recent ON post_comments(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);

CREATE INDEX IF NOT EXISTS idx_reels_author ON reels(author_id);
CREATE INDEX IF NOT EXISTS idx_reels_created ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_tsv ON reels USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS idx_reels_trgm ON reels USING gin (caption gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_reel_likes_reel ON reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user ON reel_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_reel_views_reel ON reel_views(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_views_user ON reel_views(user_id);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_presence_user ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_conversation ON presence(conversation_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_tsv ON campaigns USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS idx_campaigns_title_trgm ON campaigns USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id);

CREATE INDEX IF NOT EXISTS idx_listeners_active ON listeners(is_active);
CREATE INDEX IF NOT EXISTS idx_listeners_user ON listeners(user_id);

CREATE INDEX IF NOT EXISTS idx_slots_listener_start ON slots(listener_id, start_at);
CREATE INDEX IF NOT EXISTS idx_slots_listener_end ON slots(listener_id, end_at);

CREATE INDEX IF NOT EXISTS idx_sessions_listener ON sessions(listener_id);
CREATE INDEX IF NOT EXISTS idx_sessions_seeker ON sessions(seeker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_draws_draw_at ON draws(draw_at);

CREATE INDEX IF NOT EXISTS idx_entries_draw ON entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON reports(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_safety_entity ON safety_flags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_safety_status ON safety_flags(status);

CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(name, created_at);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rate_user_route ON rate_events(user_id, route, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_ip_route ON rate_events(ip, route, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ref_codes_owner ON referral_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);

CREATE INDEX IF NOT EXISTS idx_delete_requests_user ON delete_requests(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE delete_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: users can read all, update own
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Posts: public read, authenticated create/update own
CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (NOT is_hidden);
CREATE POLICY "posts_create_own" ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- Post likes: authenticated users can like/unlike
CREATE POLICY "post_likes_read_all" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_create_own" ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE USING (user_id = auth.uid());

-- Post comments: public read, authenticated create/update own
CREATE POLICY "post_comments_read_all" ON post_comments FOR SELECT USING (NOT is_hidden);
CREATE POLICY "post_comments_create_own" ON post_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "post_comments_update_own" ON post_comments FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- Follows: users can follow/unfollow, read all
CREATE POLICY "follows_read_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_create_own" ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (follower_id = auth.uid());

-- Reels: public read, authenticated create/update own
CREATE POLICY "reels_read_all" ON reels FOR SELECT USING (NOT COALESCE(is_hidden, false));
CREATE POLICY "reels_create_own" ON reels FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "reels_update_own" ON reels FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- Reel likes: authenticated users can like/unlike
CREATE POLICY "reel_likes_read_all" ON reel_likes FOR SELECT USING (true);
CREATE POLICY "reel_likes_create_own" ON reel_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reel_likes_delete_own" ON reel_likes FOR DELETE USING (user_id = auth.uid());

-- Reel views: authenticated users can view
CREATE POLICY "reel_views_read_all" ON reel_views FOR SELECT USING (true);
CREATE POLICY "reel_views_create_own" ON reel_views FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reel_views_update_own" ON reel_views FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Conversations: members can read/update
CREATE POLICY "conversations_read_members" ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "conversations_update_members" ON conversations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = id AND user_id = auth.uid())
) WITH CHECK (true);

-- Conversation members: members can read, authenticated can join
CREATE POLICY "conv_members_read_members" ON conversation_members FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversation_members.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "conv_members_create_own" ON conversation_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "conv_members_update_own" ON conversation_members FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Messages: conversation members can read/create
CREATE POLICY "messages_read_members" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "messages_create_members" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Presence: conversation members can view/update
CREATE POLICY "presence_read_members" ON presence FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = presence.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "presence_update_own" ON presence FOR ALL USING (user_id = auth.uid());

-- Campaigns: public read, authenticated create/update own
CREATE POLICY "campaigns_read_all" ON campaigns FOR SELECT USING (status = 'live' OR owner_id = auth.uid());
CREATE POLICY "campaigns_create_own" ON campaigns FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "campaigns_update_own" ON campaigns FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Donations: donors and campaign owners can read, authenticated can donate
CREATE POLICY "donations_read_involved" ON donations FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND owner_id = auth.uid())
);
CREATE POLICY "donations_create_own" ON donations FOR INSERT WITH CHECK (user_id = auth.uid());

-- Listeners: public read, authenticated create/update own
CREATE POLICY "listeners_read_all" ON listeners FOR SELECT USING (is_active);
CREATE POLICY "listeners_create_own" ON listeners FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "listeners_update_own" ON listeners FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Slots: public read available, listeners manage own
CREATE POLICY "slots_read_available" ON slots FOR SELECT USING (NOT is_booked OR EXISTS (SELECT 1 FROM listeners WHERE id = listener_id AND user_id = auth.uid()));
CREATE POLICY "slots_manage_own" ON slots FOR ALL USING (EXISTS (SELECT 1 FROM listeners WHERE id = listener_id AND user_id = auth.uid()));

-- Sessions: participants can read/update
CREATE POLICY "sessions_read_participants" ON sessions FOR SELECT USING (
    seeker_id = auth.uid() OR EXISTS (SELECT 1 FROM listeners WHERE id = listener_id AND user_id = auth.uid())
);
CREATE POLICY "sessions_create_seeker" ON sessions FOR INSERT WITH CHECK (seeker_id = auth.uid());
CREATE POLICY "sessions_update_participants" ON sessions FOR UPDATE USING (
    seeker_id = auth.uid() OR EXISTS (SELECT 1 FROM listeners WHERE id = listener_id AND user_id = auth.uid())
) WITH CHECK (true);

-- Draws: public read, authenticated can enter
CREATE POLICY "draws_read_all" ON draws FOR SELECT USING (true);

-- Entries: users can read all, create own
CREATE POLICY "entries_read_all" ON entries FOR SELECT USING (true);
CREATE POLICY "entries_create_own" ON entries FOR INSERT WITH CHECK (user_id = auth.uid());

-- Transactions: users can read own
CREATE POLICY "transactions_read_own" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions_create_own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reports: users can create, admins can read all
CREATE POLICY "reports_create_own" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_read_admin" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Safety flags: admins only
CREATE POLICY "safety_admin_read" ON safety_flags FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "safety_admin_write" ON safety_flags FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
) WITH CHECK (true);

-- Events: users can create own, admins can read all
CREATE POLICY "events_create_own" ON events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "events_read_admin" ON events FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Audit logs: admins only
CREATE POLICY "audit_admin_read" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Notifications: users can read/update own
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification preferences: users can manage own
CREATE POLICY "notif_prefs_own" ON notification_prefs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Push subscriptions: users can manage own
CREATE POLICY "push_subs_read_own" ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_subs_write_own" ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_subs_delete_own" ON push_subscriptions FOR DELETE USING (user_id = auth.uid());

-- Rate events: authenticated users can insert
CREATE POLICY "rate_insert_authed" ON rate_events FOR INSERT TO authenticated USING (true) WITH CHECK (true);

-- Referral codes: users can read own, create own
CREATE POLICY "ref_code_owner_read" ON referral_codes FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "ref_code_owner_insert" ON referral_codes FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Referrals: inviter/invitee can read
CREATE POLICY "ref_list_inviter_invitee" ON referrals FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

-- Referral credits: users can manage own
CREATE POLICY "ref_credits_owner_rw" ON referral_credits FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Delete requests: users can manage own
CREATE POLICY "delete_req_owner_read" ON delete_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "delete_req_owner_insert" ON delete_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create useful functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Presence timestamp function
CREATE OR REPLACE FUNCTION update_presence_timestamp()
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
CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON reels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presence_updated_at BEFORE UPDATE ON presence FOR EACH ROW EXECUTE FUNCTION update_presence_timestamp();
CREATE TRIGGER update_delete_requests_updated_at BEFORE UPDATE ON delete_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Slot overlap prevention
CREATE OR REPLACE FUNCTION check_slot_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM slots 
        WHERE listener_id = NEW.listener_id 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
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
$$ language 'plpgsql';

CREATE TRIGGER trigger_check_slot_overlap
    BEFORE INSERT OR UPDATE ON slots
    FOR EACH ROW EXECUTE FUNCTION check_slot_overlap();

-- Campaign increment function
CREATE OR REPLACE FUNCTION inc_campaign_raised(p_campaign UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE SQL AS $$
    UPDATE campaigns SET raised_amount = raised_amount + p_amount
    WHERE id = p_campaign;
$$;

-- Draw closing function
CREATE OR REPLACE FUNCTION close_draw(p_draw UUID, p_closed_at TIMESTAMPTZ)
RETURNS VOID
LANGUAGE SQL AS $$
    UPDATE draws 
    SET status = 'closed',
        result = COALESCE(result, '{}'::jsonb) || jsonb_build_object('closed_at', p_closed_at)
    WHERE id = p_draw AND status = 'upcoming';
$$;

-- Referral credits increment
CREATE OR REPLACE FUNCTION increment_referral_credits(p_user_id UUID, p_days INTEGER)
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

-- Document counter increment
CREATE OR REPLACE FUNCTION doc_counter_inc(p_doc TEXT, p_period TEXT)
RETURNS TABLE(num INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE doc_counters 
    SET counter = counter + 1 
    WHERE doc_type = p_doc AND period = p_period;
    
    IF FOUND THEN
        RETURN QUERY SELECT counter FROM doc_counters 
        WHERE doc_type = p_doc AND period = p_period;
    ELSE
        INSERT INTO doc_counters (doc_type, period, counter) 
        VALUES (p_doc, p_period, 1);
        RETURN QUERY SELECT 1 AS num;
    END IF;
END;
$$;

-- Hashtag extraction function
CREATE OR REPLACE FUNCTION extract_tags(txt TEXT) RETURNS TEXT[]
LANGUAGE SQL IMMUTABLE AS $$
    SELECT array(
        SELECT lower(m[1]) FROM regexp_matches(txt, '#([A-Za-z0-9_]{2,50})', 'g') AS m
    );
$$;

-- Array intersection helper
CREATE OR REPLACE FUNCTION array_intersect(a TEXT[], b TEXT[]) RETURNS INTEGER
LANGUAGE SQL IMMUTABLE AS $$
    SELECT COALESCE(cardinality(array(SELECT unnest(a) INTERSECT SELECT unnest(b))), 0);
$$;

-- Create materialized view for trending hashtags
CREATE MATERIALIZED VIEW IF NOT EXISTS v_trending_hashtags AS
WITH recent AS (
    SELECT created_at, unnest(extract_tags(COALESCE(body,''))) AS tag
    FROM posts
    WHERE is_hidden = false AND created_at > NOW() - INTERVAL '24 hours'
    UNION ALL
    SELECT created_at, unnest(extract_tags(COALESCE(caption,''))) AS tag
    FROM reels
    WHERE COALESCE(is_hidden,false) = false AND created_at > NOW() - INTERVAL '24 hours'
)
SELECT tag, count(*)::INTEGER AS cnt, max(created_at) AS last_used
FROM recent
GROUP BY tag
ORDER BY cnt DESC, last_used DESC;

CREATE INDEX IF NOT EXISTS idx_trending_hashtags_cnt ON v_trending_hashtags(cnt DESC);

-- Trending campaigns view
CREATE OR REPLACE VIEW v_trending_campaigns_24h AS
SELECT c.id, c.title, sum(d.amount)::BIGINT AS amount_24h, count(d.id)::INTEGER AS donors_24h
FROM campaigns c
LEFT JOIN donations d ON d.campaign_id = c.id AND d.status='captured' AND d.created_at > NOW() - INTERVAL '24 hours'
WHERE c.status='live'
GROUP BY c.id, c.title
ORDER BY amount_24h DESC, donors_24h DESC;

-- Post engagement view
CREATE OR REPLACE VIEW v_post_engagement_6h AS
SELECT
    p.id AS post_id,
    count(DISTINCT pl.id) FILTER (WHERE pl.created_at > NOW() - INTERVAL '6 hours') AS likes6h,
    count(DISTINCT pc.id) FILTER (WHERE pc.created_at > NOW() - INTERVAL '6 hours') AS comments6h
FROM posts p
LEFT JOIN post_likes pl ON pl.post_id = p.id
LEFT JOIN post_comments pc ON pc.post_id = p.id
GROUP BY p.id;

-- Daily events view (IST timezone)
CREATE OR REPLACE VIEW v_event_daily_ist AS
SELECT
    (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day_ist,
    name,
    count(*) AS cnt
FROM events
GROUP BY 1,2
ORDER BY 1 DESC, 2;

-- Refresh trending function
CREATE OR REPLACE FUNCTION refresh_trending() RETURNS VOID
LANGUAGE SQL SECURITY DEFINER AS $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_trending_hashtags;
$$;

-- Create storage buckets (these need to be run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

COMMIT;
EOF

echo "✅ Database schema created successfully!"

# Generate TypeScript types if supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "🔧 Generating TypeScript types..."
    supabase gen types typescript --local > lib/database.types.ts 2>/dev/null || echo "⚠️  Could not generate types automatically"
fi

echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Create storage buckets in Supabase dashboard:"
echo "   - avatars (public)"
echo "   - media (public)" 
echo "   - documents (private)"
echo ""
echo "2. Set up your environment variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "3. Create your first admin user in the profiles table"
echo ""
echo "4. Test the connection with: npm run dev"
