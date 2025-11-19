-- Enhanced tables for Samvaaha social feed functionality

-- User preferences for AI optimization
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_optimizations JSONB DEFAULT '{}',
  feed_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  last_optimization TIMESTAMPTZ,
  optimization_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Blockchain records for content verification
CREATE TABLE IF NOT EXISTS blockchain_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'reel', 'profile')),
  transaction_hash TEXT,
  block_number BIGINT,
  integrity_hash TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  transaction_type TEXT DEFAULT 'content_verification',
  network_id TEXT DEFAULT 'mahakavya_chain',
  gas_used BIGINT,
  transaction_fee DECIMAL(18, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- User automations for RPA functionality
CREATE TABLE IF NOT EXISTS user_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_name TEXT NOT NULL,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('content_moderation', 'engagement_optimization', 'scheduling', 'analytics')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'running')),
  configuration JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPA jobs tracking
CREATE TABLE IF NOT EXISTS rpa_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  external_job_id TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced posts table with blockchain verification
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blockchain_hash TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_enhanced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_score DECIMAL(3, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rpa_processed BOOLEAN DEFAULT false;

-- User activity logs for comprehensive tracking
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  action TEXT NOT NULL,
  page TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trending topics tracking
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hashtag TEXT NOT NULL,
  post_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(5, 2) DEFAULT 0.0,
  category TEXT DEFAULT 'general',
  is_rising BOOLEAN DEFAULT false,
  time_period TEXT DEFAULT '24h',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hashtag, time_period, calculated_at::date)
);

-- AI insights cache
CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  insights_data JSONB NOT NULL,
  confidence_score DECIMAL(3, 2) DEFAULT 0.0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, insight_type)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_user_id ON blockchain_records(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_content ON blockchain_records(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_automations_user_id ON user_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_automations_status ON user_automations(status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_user_id ON rpa_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_status ON rpa_jobs(status);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_hashtag ON trending_topics(hashtag);
CREATE INDEX IF NOT EXISTS idx_trending_topics_calculated_at ON trending_topics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_user_id ON ai_insights_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_expires_at ON ai_insights_cache(expires_at);

-- Enhanced posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_blockchain_verified ON posts(blockchain_verified) WHERE blockchain_verified = true;
CREATE INDEX IF NOT EXISTS idx_posts_ai_enhanced ON posts(ai_enhanced) WHERE ai_enhanced = true;
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin ON posts USING gin(tags);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Blockchain records policies
CREATE POLICY "Users can view own blockchain records" ON blockchain_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert blockchain records" ON blockchain_records
  FOR INSERT WITH CHECK (true);

-- User automations policies
CREATE POLICY "Users can manage own automations" ON user_automations
  FOR ALL USING (auth.uid() = user_id);

-- RPA jobs policies
CREATE POLICY "Users can view own RPA jobs" ON rpa_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage RPA jobs" ON rpa_jobs
  FOR ALL WITH CHECK (true);

-- User activity logs policies
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

-- Trending topics policies (public read)
CREATE POLICY "Anyone can view trending topics" ON trending_topics
  FOR SELECT USING (true);

CREATE POLICY "System can manage trending topics" ON trending_topics
  FOR ALL WITH CHECK (true);

-- AI insights cache policies
CREATE POLICY "Users can view own AI insights" ON ai_insights_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage AI insights" ON ai_insights_cache
  FOR ALL WITH CHECK (true);

-- Functions for automated cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_ai_insights()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_insights_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trending topics
CREATE OR REPLACE FUNCTION update_trending_topics()
RETURNS void AS $$
DECLARE
  topic_record RECORD;
BEGIN
  -- Clear old trending data
  DELETE FROM trending_topics WHERE calculated_at < NOW() - INTERVAL '1 day';
  
  -- Calculate new trending topics from recent posts
  FOR topic_record IN
    SELECT 
      unnest(tags) as hashtag,
      COUNT(*) as post_count,
      AVG(likes_count + comments_count) as avg_engagement
    FROM posts 
    WHERE created_at > NOW() - INTERVAL '24 hours'
      AND tags IS NOT NULL 
      AND array_length(tags, 1) > 0
    GROUP BY unnest(tags)
    HAVING COUNT(*) >= 2
    ORDER BY COUNT(*) DESC, AVG(likes_count + comments_count) DESC
    LIMIT 50
  LOOP
    INSERT INTO trending_topics (hashtag, post_count, engagement_score, calculated_at)
    VALUES (
      topic_record.hashtag,
      topic_record.post_count,
      COALESCE(topic_record.avg_engagement, 0),
      NOW()
    )
    ON CONFLICT (hashtag, time_period, calculated_at::date) 
    DO UPDATE SET 
      post_count = EXCLUDED.post_count,
      engagement_score = EXCLUDED.engagement_score,
      calculated_at = EXCLUDED.calculated_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_ai_insights() TO authenticated;
GRANT EXECUTE ON FUNCTION update_trending_topics() TO authenticated;
