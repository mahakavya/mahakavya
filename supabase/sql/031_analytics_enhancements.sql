-- Analytics Enhancement Schema for Vivechana
-- Advanced analytics tables and functions for comprehensive platform insights

-- User Sessions Table for Real-time Analytics
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_type TEXT,
  browser TEXT,
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_duration INTEGER, -- in seconds
  page_views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events Table for Detailed Tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'page_view', 'click', 'scroll', etc.
  event_name TEXT,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  session_duration INTEGER,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs Table for Monitoring
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  page_url TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analytics Insights Table
CREATE TABLE IF NOT EXISTS ai_analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_range TEXT NOT NULL,
  insights JSONB NOT NULL,
  confidence_score INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain Analytics Records
CREATE TABLE IF NOT EXISTS blockchain_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT,
  transaction_type TEXT, -- 'user_verification', 'content_hash', 'payment'
  data_hash TEXT,
  verification_status TEXT DEFAULT 'pending',
  gas_used BIGINT,
  transaction_fee DECIMAL(20,8),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPA Job Analytics
CREATE TABLE IF NOT EXISTS rpa_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  job_type TEXT NOT NULL, -- 'content_moderation', 'user_analysis', 'data_processing'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  records_processed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  error_count INTEGER DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'response_time', 'throughput', 'error_rate'
  metric_value DECIMAL(10,4),
  endpoint TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tags JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_analytics_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_analytics_created ON blockchain_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rpa_analytics_status ON rpa_analytics(status);

-- Create materialized views for fast analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_user_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE last_sign_in_at >= CURRENT_DATE) as active_users,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as premium_users
FROM profiles 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_engagement_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
  AVG(session_duration) as avg_session_duration
FROM analytics_events 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_realtime_stats AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_events,
  AVG(session_duration) as avg_session_duration
FROM analytics_events 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Functions to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_user_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_realtime_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to track user session
CREATE OR REPLACE FUNCTION track_user_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_device_type TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  INSERT INTO user_sessions (
    user_id, session_id, device_type, user_agent, ip_address
  ) VALUES (
    p_user_id, p_session_id, p_device_type, p_user_agent, p_ip_address
  ) RETURNING id INTO session_uuid;
  
  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to end user session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    ended_at = NOW(),
    session_duration = EXTRACT(EPOCH FROM (NOW() - started_at)),
    is_active = false
  WHERE session_id = p_session_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to log analytics event
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_user_id UUID,
  p_session_id TEXT,
  p_event_type TEXT,
  p_event_name TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_properties JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    user_id, session_id, event_type, event_name, page_url, properties
  ) VALUES (
    p_user_id, p_session_id, p_event_type, p_event_name, p_page_url, p_properties
  ) RETURNING id INTO event_id;
  
  -- Update session activity
  UPDATE user_sessions 
  SET 
    last_activity = NOW(),
    page_views = page_views + CASE WHEN p_event_type = 'page_view' THEN 1 ELSE 0 END
  WHERE session_id = p_session_id AND is_active = true;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_sessions INTEGER,
  total_page_views INTEGER,
  avg_session_duration NUMERIC,
  last_active TIMESTAMPTZ,
  device_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT us.session_id)::INTEGER as total_sessions,
    COALESCE(SUM(us.page_views), 0)::INTEGER as total_page_views,
    ROUND(AVG(us.session_duration), 2) as avg_session_duration,
    MAX(us.last_activity) as last_active,
    COALESCE(
      jsonb_object_agg(
        us.device_type, 
        COUNT(*)
      ) FILTER (WHERE us.device_type IS NOT NULL),
      '{}'::jsonb
    ) as device_breakdown
  FROM user_sessions us
  WHERE us.user_id = p_user_id 
    AND us.created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admin access for analytics
CREATE POLICY "Admins can access all analytics data" ON user_sessions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin')
  ));

CREATE POLICY "Admins can access all events" ON analytics_events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin')
  ));

CREATE POLICY "Admins can access error logs" ON error_logs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin')
  ));

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (user_id = auth.uid());

-- Sample data for analytics
INSERT INTO analytics_events (user_id, event_type, event_name, device_type, country) 
SELECT 
  p.id,
  (ARRAY['page_view', 'click', 'scroll', 'form_submit'])[floor(random() * 4 + 1)],
  (ARRAY['home_page', 'profile_view', 'post_create', 'settings'])[floor(random() * 4 + 1)],
  (ARRAY['mobile', 'desktop', 'tablet'])[floor(random() * 3 + 1)],
  COALESCE(p.country, 'Unknown')
FROM profiles p
WHERE p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY random() 
LIMIT 1000;

-- Create scheduled job to refresh analytics views (requires pg_cron extension)
-- SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_analytics_views();');

COMMENT ON TABLE user_sessions IS 'Tracks user session data for real-time analytics';
COMMENT ON TABLE analytics_events IS 'Detailed event tracking for user behavior analysis';
COMMENT ON TABLE ai_analytics_insights IS 'AI-generated insights and predictions';
COMMENT ON TABLE blockchain_analytics IS 'Blockchain transaction analytics';
COMMENT ON TABLE rpa_analytics IS 'RPA job performance metrics';
