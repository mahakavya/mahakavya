-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    shadow_muted BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature access table
CREATE TABLE feature_access (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    has_access BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, feature_name)
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_urls TEXT[],
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post likes table
CREATE TABLE post_likes (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comment likes table
CREATE TABLE comment_likes (
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Create follows table
CREATE TABLE follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, followee_id),
    CHECK (follower_id != followee_id)
);

-- Create campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
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

-- Create donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create draws table
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    draw_at TIMESTAMPTZ NOT NULL,
    ticket_price INTEGER DEFAULT 0 CHECK (ticket_price >= 0),
    max_entries INTEGER,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'closed', 'completed', 'cancelled')),
    seed TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create draw entries table
CREATE TABLE draw_entries (
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    entries_count INTEGER DEFAULT 1 CHECK (entries_count > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (draw_id, user_id)
);

-- Create reels table
CREATE TABLE reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create reel likes table
CREATE TABLE reel_likes (
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (reel_id, user_id)
);

-- Create reel views table
CREATE TABLE reel_views (
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    view_duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (reel_id, user_id)
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation participants table
CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    attachments TEXT[],
    reply_to UUID REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sahaya listeners table
CREATE TABLE sahaya_listeners (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    expertise TEXT[],
    languages TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    availability JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sahaya sessions table
CREATE TABLE sahaya_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listener_id UUID REFERENCES sahaya_listeners(user_id) ON DELETE CASCADE NOT NULL,
    seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT CHECK (content_type IN ('post', 'comment', 'reel', 'user', 'campaign')),
    content_id UUID,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_amount INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, referee_id)
);

-- Create updated_at trigger function
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
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON reels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sahaya_listeners_updated_at BEFORE UPDATE ON sahaya_listeners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sahaya_sessions_updated_at BEFORE UPDATE ON sahaya_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
