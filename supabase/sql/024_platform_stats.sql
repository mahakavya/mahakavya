-- Platform Statistics Views and Functions
-- This migration creates optimized views and functions for platform statistics

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN last_seen >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN 1 END) as new_users_prev_30d
FROM profiles;

-- Create materialized view for content statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS content_stats AS
SELECT 
  (SELECT COUNT(*) FROM posts) +
  (SELECT COUNT(*) FROM reels) +
  (SELECT COUNT(*) FROM fundraising_campaigns) as total_content,
  (SELECT COUNT(*) FROM posts WHERE created_at >= NOW() - INTERVAL '30 days') as recent_posts,
  (SELECT COUNT(*) FROM reels WHERE created_at >= NOW() - INTERVAL '30 days') as recent_reels
;

-- Create materialized view for fundraising statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS fundraising_stats AS
SELECT 
  COALESCE(SUM(amount_raised), 0) as total_funds_raised,
  COUNT(*) as total_campaigns,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
  AVG(amount_raised) as avg_campaign_amount
FROM fundraising_campaigns;

-- Create materialized view for support statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS support_stats AS
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_sessions,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_session_duration_minutes
FROM sahaya_sessions
WHERE started_at IS NOT NULL;

-- Function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  growth_rate NUMERIC;
BEGIN
  -- Calculate growth rate
  SELECT 
    CASE 
      WHEN new_users_prev_30d > 0 THEN 
        ROUND(((new_users_30d::NUMERIC - new_users_prev_30d::NUMERIC) / new_users_prev_30d::NUMERIC) * 100, 1)
      ELSE 100
    END INTO growth_rate
  FROM user_stats;

  -- Build result JSON
  SELECT json_build_object(
    'totalUsers', us.total_users,
    'activeUsers', us.active_users,
    'contentCreated', cs.total_content,
    'fundsRaised', fs.total_funds_raised,
    'supportSessions', ss.completed_sessions,
    'communityGrowth', GREATEST(growth_rate, 5),
    'lastUpdated', NOW()
  ) INTO result
  FROM user_stats us, content_stats cs, fundraising_stats fs, support_stats ss;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_stats;
  REFRESH MATERIALIZED VIEW content_stats;
  REFRESH MATERIALIZED VIEW fundraising_stats;
  REFRESH MATERIALIZED VIEW support_stats;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON fundraising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON fundraising_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_sahaya_sessions_status ON sahaya_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sahaya_sessions_created_at ON sahaya_sessions(created_at);

-- Initial refresh of materialized views
SELECT refresh_platform_stats();

-- Set up automatic refresh (every hour)
-- Note: This would typically be done with pg_cron in production
-- For now, we'll refresh manually via API calls
