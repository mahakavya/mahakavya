-- Infrastructure Scaling and Performance Optimization
-- This script sets up database optimizations for high-scale operations

-- ============================================
-- 1. PARTITIONING FOR LARGE TABLES
-- ============================================

-- Partition events table by date for better query performance
CREATE TABLE IF NOT EXISTS events_partitioned (
  LIKE events INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month (example for 2024-2025)
CREATE TABLE events_2024_q1 PARTITION OF events_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE events_2024_q2 PARTITION OF events_partitioned
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE events_2024_q3 PARTITION OF events_partitioned
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE events_2024_q4 PARTITION OF events_partitioned
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

CREATE TABLE events_2025_q1 PARTITION OF events_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- ============================================
-- 2. MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================

-- User engagement summary (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_summary AS
SELECT 
  p.user_id,
  COUNT(DISTINCT posts.id) as total_posts,
  COUNT(DISTINCT pl.id) as total_likes_given,
  COUNT(DISTINCT pc.id) as total_comments,
  COUNT(DISTINCT received_likes.id) as total_likes_received,
  AVG(posts.likes_count) as avg_likes_per_post,
  MAX(posts.created_at) as last_post_at
FROM profiles p
LEFT JOIN posts ON posts.author_id = p.user_id
LEFT JOIN post_likes pl ON pl.user_id = p.user_id
LEFT JOIN post_comments pc ON pc.author_id = p.user_id
LEFT JOIN post_likes received_likes ON received_likes.post_id = posts.id
WHERE posts.created_at > NOW() - INTERVAL '90 days'
GROUP BY p.user_id;

CREATE UNIQUE INDEX ON user_engagement_summary (user_id);

-- Content performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS content_performance AS
SELECT 
  posts.id,
  posts.author_id,
  posts.created_at,
  posts.likes_count,
  posts.comments_count,
  posts.likes_count + posts.comments_count * 2 as engagement_score,
  EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 3600 as age_hours,
  (posts.likes_count + posts.comments_count * 2)::float / 
    NULLIF(EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 3600, 0) as viral_velocity
FROM posts
WHERE posts.created_at > NOW() - INTERVAL '7 days'
ORDER BY viral_velocity DESC NULLS LAST;

CREATE INDEX ON content_performance (viral_velocity DESC NULLS LAST);
CREATE INDEX ON content_performance (engagement_score DESC);

-- ============================================
-- 3. CONNECTION POOLING & QUERY OPTIMIZATION
-- ============================================

-- Set optimal connection pool settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '10MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- ============================================
-- 4. ADVANCED INDEXING
-- ============================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_created 
  ON posts(author_id, created_at DESC) WHERE hidden = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_engagement 
  ON posts((likes_count + comments_count)) WHERE hidden = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, created_at DESC) WHERE read = false;

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_fts 
  ON posts USING gin(to_tsvector('english', content));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_search_fts 
  ON campaigns USING gin(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  );

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_live 
  ON campaigns(created_at DESC) WHERE status = 'live';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reels_published 
  ON reels(created_at DESC) WHERE status = 'published';

-- ============================================
-- 5. CACHING LAYER FUNCTIONS
-- ============================================

-- Cache frequently accessed data in temporary tables
CREATE OR REPLACE FUNCTION refresh_trending_content()
RETURNS void AS $$
BEGIN
  -- Refresh trending posts cache
  CREATE TEMP TABLE IF NOT EXISTS trending_posts_cache AS
  SELECT 
    id,
    content,
    author_id,
    likes_count,
    comments_count,
    created_at,
    (likes_count + comments_count * 2)::float / 
      NULLIF(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600, 0) as trend_score
  FROM posts
  WHERE created_at > NOW() - INTERVAL '24 hours'
    AND hidden = false
  ORDER BY trend_score DESC NULLS LAST
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. AUTOMATED MAINTENANCE
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY content_performance;
  
  RAISE NOTICE 'All materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-analytics', '0 2 * * *', 'SELECT refresh_all_materialized_views()');

-- ============================================
-- 7. QUERY PERFORMANCE MONITORING
-- ============================================

-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms integer DEFAULT 1000)
RETURNS TABLE (
  query text,
  calls bigint,
  total_time_ms double precision,
  mean_time_ms double precision,
  max_time_ms double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    substring(pss.query, 1, 100) as query,
    pss.calls,
    pss.total_exec_time as total_time_ms,
    pss.mean_exec_time as mean_time_ms,
    pss.max_exec_time as max_time_ms
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > min_duration_ms
  ORDER BY pss.total_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. LOAD BALANCING SETUP
-- ============================================

-- Create read replicas configuration table
CREATE TABLE IF NOT EXISTS read_replicas (
  id serial PRIMARY KEY,
  name text NOT NULL,
  connection_string text NOT NULL,
  weight integer DEFAULT 1,
  health_status text DEFAULT 'healthy',
  last_health_check timestamp DEFAULT NOW(),
  created_at timestamp DEFAULT NOW()
);

-- Function to get optimal read replica
CREATE OR REPLACE FUNCTION get_read_replica()
RETURNS text AS $$
DECLARE
  replica_connection text;
BEGIN
  SELECT connection_string INTO replica_connection
  FROM read_replicas
  WHERE health_status = 'healthy'
  ORDER BY RANDOM() * weight DESC
  LIMIT 1;
  
  RETURN COALESCE(replica_connection, current_setting('DATABASE_URL'));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TABLE-SPECIFIC RECOMMENDATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  streamer_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('scheduled', 'live', 'ended')),
  scheduled_for timestamp,
  started_at timestamp,
  ended_at timestamp,
  viewer_count integer DEFAULT 0,
  chat_enabled boolean DEFAULT true,
  stream_key text UNIQUE,
  playback_url text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_live_streams_status ON live_streams(status, created_at DESC);
CREATE INDEX idx_live_streams_streamer ON live_streams(streamer_id);

CREATE TABLE IF NOT EXISTS stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  joined_at timestamp DEFAULT NOW(),
  left_at timestamp,
  watch_duration_seconds integer DEFAULT 0
);

CREATE INDEX idx_stream_viewers_stream ON stream_viewers(stream_id, joined_at DESC);
CREATE INDEX idx_stream_viewers_user ON stream_viewers(user_id);

CREATE TABLE IF NOT EXISTS stream_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  message text NOT NULL,
  timestamp timestamp DEFAULT NOW()
);

CREATE INDEX idx_stream_chat_stream ON stream_chat(stream_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS stream_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  created_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_stream_reactions_stream ON stream_reactions(stream_id);

-- Recommendation feedback table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  interaction_type text NOT NULL,
  weight numeric DEFAULT 1.0,
  created_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_recommendation_feedback_user ON recommendation_feedback(user_id, created_at DESC);
CREATE INDEX idx_recommendation_feedback_content ON recommendation_feedback(content_id);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✓ Infrastructure scaling setup complete';
  RAISE NOTICE '✓ Materialized views created';
  RAISE NOTICE '✓ Advanced indexes created';
  RAISE NOTICE '✓ Live streaming tables created';
  RAISE NOTICE '✓ Recommendation system tables created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Schedule materialized view refreshes';
  RAISE NOTICE '2. Configure read replicas in read_replicas table';
  RAISE NOTICE '3. Monitor slow queries with get_slow_queries()';
  RAISE NOTICE '4. Set up connection pooling (PgBouncer recommended)';
END $$;
