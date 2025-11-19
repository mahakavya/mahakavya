-- Database Optimization Functions and Indexes
-- Improves query performance and provides analysis tools

-- ============================================
-- SECTION 1: Performance Analysis Functions
-- ============================================

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms bigint DEFAULT 1000)
RETURNS TABLE (
  query text,
  calls bigint,
  mean_exec_time double precision,
  rows bigint
) AS $$
BEGIN
  -- Note: Requires pg_stat_statements extension
  RETURN QUERY
  SELECT
    query::text,
    calls::bigint,
    mean_exec_time::double precision,
    rows::bigint
  FROM pg_stat_statements
  WHERE mean_exec_time > min_duration_ms
  ORDER BY mean_exec_time DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if index exists
CREATE OR REPLACE FUNCTION check_index_exists(p_table text, p_column text)
RETURNS boolean AS $$
DECLARE
  index_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = p_table
    AND indexdef LIKE '%' || p_column || '%'
  ) INTO index_exists;
  
  RETURN index_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create index if not exists
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
  p_index_name text,
  p_table text,
  p_column text
)
RETURNS void AS $$
BEGIN
  IF NOT check_index_exists(p_table, p_column) THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (%I)', 
      p_index_name, p_table, p_column);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 2: Recommended Indexes
-- ============================================

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- Post interactions
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- Reels
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_status ON reels(status);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user_id ON reel_likes(user_id);

-- Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON conversation_members(conversation_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Sessions and listeners
CREATE INDEX IF NOT EXISTS idx_sessions_listener_id ON sessions(listener_id);
CREATE INDEX IF NOT EXISTS idx_sessions_seeker_id ON sessions(seeker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_slots_listener_id ON slots(listener_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_time ON slots(start_time);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_posts_content_fts ON posts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_campaigns_title_fts ON campaigns USING gin(to_tsvector('english', title));

-- ============================================
-- SECTION 3: Materialized Views for Analytics
-- ============================================

-- User engagement statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_stats AS
SELECT
  p.id as user_id,
  p.full_name,
  COUNT(DISTINCT posts.id) as total_posts,
  COUNT(DISTINCT post_likes.id) as total_likes_given,
  COUNT(DISTINCT pl.id) as total_likes_received,
  COUNT(DISTINCT post_comments.id) as total_comments,
  COUNT(DISTINCT messages.id) as total_messages_sent,
  AVG(posts.likes_count) as avg_likes_per_post,
  MAX(posts.created_at) as last_post_at
FROM profiles p
LEFT JOIN posts ON posts.user_id = p.id
LEFT JOIN post_likes ON post_likes.user_id = p.id
LEFT JOIN post_likes pl ON pl.post_id = posts.id
LEFT JOIN post_comments ON post_comments.user_id = p.id
LEFT JOIN messages ON messages.sender_id = p.id
GROUP BY p.id, p.full_name;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement_stats(user_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_engagement_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Campaign performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS campaign_performance AS
SELECT
  c.id as campaign_id,
  c.title,
  c.goal_amount,
  c.raised_amount,
  (c.raised_amount::float / NULLIF(c.goal_amount, 0) * 100) as completion_percentage,
  COUNT(DISTINCT d.id) as total_donations,
  AVG(d.amount) as avg_donation,
  MAX(d.created_at) as last_donation_at,
  COUNT(DISTINCT d.donor_id) as unique_donors
FROM campaigns c
LEFT JOIN donations d ON d.campaign_id = c.id
GROUP BY c.id, c.title, c.goal_amount, c.raised_amount;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_perf_id ON campaign_performance(campaign_id);

-- ============================================
-- SECTION 4: Query Optimization Functions
-- ============================================

-- Function to get user feed efficiently
CREATE OR REPLACE FUNCTION get_user_feed(
  p_user_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  post_id uuid,
  content text,
  media_urls jsonb,
  created_at timestamptz,
  likes_count int,
  comments_count int,
  author_id uuid,
  author_name text,
  author_avatar text,
  user_has_liked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.content,
    p.media_urls,
    p.created_at,
    p.likes_count,
    p.comments_count,
    prof.id,
    prof.full_name,
    prof.avatar_url,
    EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id)
  FROM posts p
  JOIN profiles prof ON prof.id = p.user_id
  WHERE p.is_hidden = false
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vacuum and analyze tables
CREATE OR REPLACE FUNCTION optimize_tables()
RETURNS text AS $$
DECLARE
  table_name text;
  result text := '';
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('VACUUM ANALYZE %I', table_name);
    result := result || table_name || ', ';
  END LOOP;
  
  RETURN 'Optimized tables: ' || result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 5: Automated Maintenance
-- ============================================

COMMENT ON FUNCTION refresh_engagement_stats() IS 'Run this function daily to refresh user engagement statistics';
COMMENT ON FUNCTION optimize_tables() IS 'Run this function weekly to optimize database performance';
COMMENT ON MATERIALIZED VIEW user_engagement_stats IS 'User engagement metrics - refresh daily';
COMMENT ON MATERIALIZED VIEW campaign_performance IS 'Campaign performance metrics - refresh every 6 hours';
