-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
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

-- Create subscriptions table
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

-- Create payments table
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

-- Create feature_access table
CREATE TABLE IF NOT EXISTS feature_access (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  can_feed BOOLEAN DEFAULT TRUE,
  can_reels BOOLEAN DEFAULT FALSE,
  can_messaging BOOLEAN DEFAULT FALSE,
  can_fundraising BOOLEAN DEFAULT FALSE,
  can_emotional BOOLEAN DEFAULT FALSE,
  can_luckydraw BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_urls TEXT[],
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

-- Create reels table
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumb_url TEXT,
  caption TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reel_likes table
CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

-- Create reel_views table
CREATE TABLE IF NOT EXISTS reel_views (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_members table
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[],
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount INTEGER NOT NULL,
  raised_amount INTEGER DEFAULT 0,
  cover_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  status TEXT DEFAULT 'created',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create listeners table
CREATE TABLE IF NOT EXISTS listeners (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  expertise TEXT[],
  rating DECIMAL(3,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create slots table
CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create draws table
CREATE TABLE IF NOT EXISTS draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  draw_at TIMESTAMPTZ NOT NULL,
  ticket_price INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  seed TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (draw_id, user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_logs table
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  props JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_access_updated_at BEFORE UPDATE ON feature_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON reels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
