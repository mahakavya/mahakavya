-- Platform Features Table
CREATE TABLE IF NOT EXISTS platform_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('live', 'beta', 'coming-soon')),
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('social', 'wellness', 'finance', 'entertainment')),
  ai_powered BOOLEAN DEFAULT false,
  blockchain_secured BOOLEAN DEFAULT false,
  rpa_automated BOOLEAN DEFAULT false,
  active_users INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Engagement Tracking Table
CREATE TABLE IF NOT EXISTS user_engagement_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  page VARCHAR(100) NOT NULL,
  user_agent TEXT,
  ip_address INET,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Analytics Table
CREATE TABLE IF NOT EXISTS realtime_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL,
  page_name VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(action_type, page_name)
);

-- Platform Statistics View
CREATE OR REPLACE VIEW platform_statistics AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '30 days') as total_users,
  (SELECT COUNT(*) FROM fundraising_campaigns WHERE status = 'active') as active_campaigns,
  (SELECT COALESCE(SUM(amount), 0) FROM donations) as funds_raised,
  (SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0 
      ELSE COUNT(*) FILTER (WHERE raised_amount >= goal_amount)::FLOAT / COUNT(*)::FLOAT 
    END
   FROM fundraising_campaigns WHERE status = 'completed') as success_rate,
  (SELECT COALESCE(SUM(count), 0) FROM realtime_analytics WHERE action_type LIKE '%ai%') as ai_interactions,
  (SELECT COALESCE(SUM(count), 0) FROM realtime_analytics WHERE action_type LIKE '%blockchain%') as blockchain_transactions,
  (SELECT COALESCE(SUM(count), 0) FROM realtime_analytics WHERE action_type LIKE '%rpa%') as rpa_automations,
  (SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '30 days') as content_created,
  (SELECT COUNT(DISTINCT user_id) FROM user_follows WHERE created_at > NOW() - INTERVAL '30 days') as communities_formed,
  (SELECT COUNT(*) FROM sahaya_sessions WHERE status = 'completed') as wellness_sessions;

-- Function to increment real-time analytics
CREATE OR REPLACE FUNCTION increment_realtime_analytics(
  action_type TEXT,
  page_name TEXT,
  increment_value INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO realtime_analytics (action_type, page_name, count, last_updated)
  VALUES (action_type, page_name, increment_value, NOW())
  ON CONFLICT (action_type, page_name)
  DO UPDATE SET 
    count = realtime_analytics.count + increment_value,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert default platform features
INSERT INTO platform_features (name, status, description, icon_name, category, ai_powered, blockchain_secured, rpa_automated, active_users, priority) VALUES
('Samvaaha', 'live', 'AI-curated social feed with meaningful connections and personalized content recommendations', 'Globe', 'social', true, true, true, 8500, 1),
('Drishya', 'live', 'Short-form videos with AI content analysis, automated moderation, and engagement optimization', 'Video', 'entertainment', true, false, true, 6200, 2),
('Nivedana', 'live', 'Blockchain-secured fundraising campaigns with transparent tracking and automated compliance', 'Heart', 'finance', true, true, true, 3400, 3),
('Sahaya', 'beta', 'AI-assisted wellness and mental health support with professional listener network', 'Headphones', 'wellness', true, false, true, 1800, 4),
('BhagyaChakra', 'live', 'Gamified rewards system with blockchain transparency and automated prize distribution', 'Gift', 'entertainment', false, true, true, 4500, 5),
('Varta', 'coming-soon', 'End-to-end encrypted messaging platform with AI-powered translation and smart replies', 'MessageCircle', 'social', true, true, false, 0, 6)
ON CONFLICT (name) DO UPDATE SET
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  active_users = EXCLUDED.active_users,
  updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_engagement_session ON user_engagement_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_user ON user_engagement_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_action ON user_engagement_tracking(action);
CREATE INDEX IF NOT EXISTS idx_user_engagement_page ON user_engagement_tracking(page);
CREATE INDEX IF NOT EXISTS idx_user_engagement_timestamp ON user_engagement_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_action ON realtime_analytics(action_type);
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_page ON realtime_analytics(page_name);
CREATE INDEX IF NOT EXISTS idx_platform_features_status ON platform_features(status);
CREATE INDEX IF NOT EXISTS idx_platform_features_category ON platform_features(category);

-- Enable RLS
ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Platform features are publicly readable" ON platform_features FOR SELECT USING (true);
CREATE POLICY "Only admins can modify platform features" ON platform_features FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own engagement data" ON user_engagement_tracking FOR SELECT USING (
  auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin'
);
CREATE POLICY "Anyone can insert engagement data" ON user_engagement_tracking FOR INSERT WITH CHECK (true);

CREATE POLICY "Realtime analytics are publicly readable" ON realtime_analytics FOR SELECT USING (true);
CREATE POLICY "Only system can modify analytics" ON realtime_analytics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update function for platform features
CREATE OR REPLACE FUNCTION update_platform_feature_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_features_updated_at
  BEFORE UPDATE ON platform_features
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_feature_stats();
