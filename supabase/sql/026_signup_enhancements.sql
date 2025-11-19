-- Enhanced user profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  security_score INTEGER DEFAULT 0,
  blockchain_verified BOOLEAN DEFAULT FALSE,
  blockchain_hash TEXT,
  reputation_score INTEGER DEFAULT 100,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'hi-en',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
  content_filter TEXT DEFAULT 'moderate' CHECK (content_filter IN ('none', 'mild', 'moderate', 'strict')),
  ai_assistance BOOLEAN DEFAULT TRUE,
  blockchain_features BOOLEAN DEFAULT TRUE,
  rpa_automation BOOLEAN DEFAULT TRUE,
  data_sharing BOOLEAN DEFAULT FALSE,
  analytics_tracking BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User statistics table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  posts_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  likes_given INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  shares_made INTEGER DEFAULT 0,
  shares_received INTEGER DEFAULT 0,
  views_received INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 100,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  last_active TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,
  total_login_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'follow', 'like', 'comment', 'mention', 'system', 'security', 'achievement')),
  related_id UUID, -- Can reference posts, users, etc.
  related_type TEXT, -- 'post', 'user', 'comment', etc.
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'signup', 'password_change', 'email_change', 'failed_login', 'account_locked', 'suspicious_activity')),
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  risk_score DECIMAL(3,2) DEFAULT 0.00,
  threat_level TEXT DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain transactions table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_hash TEXT UNIQUE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('registration', 'verification', 'content_hash', 'reputation_update')),
  block_number BIGINT,
  gas_used INTEGER,
  gas_price BIGINT,
  network TEXT DEFAULT 'mahakavya-chain',
  contract_address TEXT,
  data_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  confirmations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation_score ON profiles(reputation_score);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_reputation_score ON user_stats(reputation_score);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_threat_level ON security_logs(threat_level);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_type ON blockchain_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (
    privacy_level = 'public' OR 
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_follows 
      WHERE follower_id = auth.uid() AND following_id = profiles.id
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user_stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can update user stats" ON user_stats
  FOR UPDATE USING (true);

CREATE POLICY "System can insert user stats" ON user_stats
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for analytics_events
CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for security_logs
CREATE POLICY "Users can view own security logs" ON security_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert security logs" ON security_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for blockchain_transactions
CREATE POLICY "Users can view own blockchain transactions" ON blockchain_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage blockchain transactions" ON blockchain_transactions
  FOR ALL USING (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate user reputation
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 100;
  post_score INTEGER := 0;
  engagement_score INTEGER := 0;
  verification_bonus INTEGER := 0;
  total_score INTEGER;
BEGIN
  -- Get post-based score
  SELECT COALESCE(posts_count * 2, 0) INTO post_score
  FROM user_stats WHERE user_id = user_uuid;
  
  -- Get engagement score
  SELECT COALESCE((likes_received + comments_received + shares_received) / 10, 0) INTO engagement_score
  FROM user_stats WHERE user_id = user_uuid;
  
  -- Verification bonus
  SELECT CASE WHEN is_verified THEN 50 ELSE 0 END INTO verification_bonus
  FROM profiles WHERE id = user_uuid;
  
  total_score := base_score + post_score + engagement_score + verification_bonus;
  
  -- Update the reputation score
  UPDATE user_stats SET reputation_score = total_score WHERE user_id = user_uuid;
  
  RETURN total_score;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT json_build_object(
        'full_name', full_name,
        'display_name', display_name,
        'avatar_url', avatar_url,
        'is_verified', is_verified,
        'reputation_score', reputation_score,
        'created_at', created_at
      ) FROM profiles WHERE id = user_uuid
    ),
    'stats', (
      SELECT json_build_object(
        'posts_count', posts_count,
        'followers_count', followers_count,
        'following_count', following_count,
        'likes_received', likes_received,
        'engagement_rate', engagement_rate,
        'streak_days', streak_days
      ) FROM user_stats WHERE user_id = user_uuid
    ),
    'recent_activity', (
      SELECT json_agg(
        json_build_object(
          'event_type', event_type,
          'created_at', created_at,
          'event_data', event_data
        )
      ) FROM (
        SELECT event_type, created_at, event_data
        FROM analytics_events 
        WHERE user_id = user_uuid 
        ORDER BY created_at DESC 
        LIMIT 10
      ) recent
    ),
    'unread_notifications', (
      SELECT COUNT(*) FROM notifications 
      WHERE user_id = user_uuid AND is_read = FALSE
    )
  ) INTO result;
  
  RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

COMMENT ON TABLE profiles IS 'Enhanced user profiles with security and blockchain features';
COMMENT ON TABLE user_preferences IS 'User preferences and settings';
COMMENT ON TABLE user_stats IS 'User statistics and engagement metrics';
COMMENT ON TABLE notifications IS 'User notifications system';
COMMENT ON TABLE analytics_events IS 'User analytics and tracking events';
COMMENT ON TABLE security_logs IS 'Security events and threat monitoring';
COMMENT ON TABLE blockchain_transactions IS 'Blockchain transaction records';
