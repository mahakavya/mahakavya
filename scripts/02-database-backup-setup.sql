-- Database backup and maintenance procedures
-- This script sets up automated backup functionality and maintenance tasks

-- ============================================================================
-- BACKUP HELPER FUNCTIONS
-- ============================================================================

-- Function to create a snapshot of critical data
CREATE OR REPLACE FUNCTION create_data_snapshot()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  snapshot_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'profiles'::TEXT as table_name,
    COUNT(*)::BIGINT as row_count,
    NOW() as snapshot_time
  FROM profiles
  UNION ALL
  SELECT 'posts'::TEXT, COUNT(*)::BIGINT, NOW() FROM posts
  UNION ALL
  SELECT 'reels'::TEXT, COUNT(*)::BIGINT, NOW() FROM reels
  UNION ALL
  SELECT 'campaigns'::TEXT, COUNT(*)::BIGINT, NOW() FROM campaigns
  UNION ALL
  SELECT 'donations'::TEXT, COUNT(*)::BIGINT, NOW() FROM donations
  UNION ALL
  SELECT 'messages'::TEXT, COUNT(*)::BIGINT, NOW() FROM messages
  UNION ALL
  SELECT 'payments'::TEXT, COUNT(*)::BIGINT, NOW() FROM payments
  UNION ALL
  SELECT 'subscriptions'::TEXT, COUNT(*)::BIGINT, NOW() FROM subscriptions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- Function to check for orphaned records
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE (
  check_name TEXT,
  issue_count BIGINT,
  status TEXT
) AS $$
BEGIN
  -- Check for posts without authors
  RETURN QUERY
  SELECT 
    'Posts without valid authors'::TEXT,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ISSUE' END
  FROM posts p
  LEFT JOIN profiles pr ON p.author_id = pr.id
  WHERE pr.id IS NULL;

  -- Check for comments without valid posts
  RETURN QUERY
  SELECT 
    'Comments without valid posts'::TEXT,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ISSUE' END
  FROM post_comments pc
  LEFT JOIN posts p ON pc.post_id = p.id
  WHERE p.id IS NULL;

  -- Check for donations without valid campaigns
  RETURN QUERY
  SELECT 
    'Donations without valid campaigns'::TEXT,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ISSUE' END
  FROM donations d
  LEFT JOIN campaigns c ON d.campaign_id = c.id
  WHERE c.id IS NULL;

  -- Check for messages without valid conversations
  RETURN QUERY
  SELECT 
    'Messages without valid conversations'::TEXT,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ISSUE' END
  FROM messages m
  LEFT JOIN conversations c ON m.conversation_id = c.id
  WHERE c.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE (
  table_name TEXT,
  rows_deleted BIGINT
) AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;

  -- Clean up old rate limit events
  DELETE FROM rate_events WHERE created_at < cutoff_date;
  RETURN QUERY SELECT 'rate_events'::TEXT, COUNT(*)::BIGINT FROM rate_events WHERE created_at < cutoff_date;

  -- Clean up old audit logs (keep for 1 year)
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '365 days';
  RETURN QUERY SELECT 'audit_logs'::TEXT, COUNT(*)::BIGINT FROM audit_logs WHERE created_at < NOW() - INTERVAL '365 days';

  -- Clean up old events (keep for 90 days)
  DELETE FROM events WHERE created_at < cutoff_date;
  RETURN QUERY SELECT 'events'::TEXT, COUNT(*)::BIGINT FROM events WHERE created_at < cutoff_date;

  -- Clean up inactive push subscriptions
  DELETE FROM push_subscriptions WHERE created_at < NOW() - INTERVAL '180 days';
  RETURN QUERY SELECT 'push_subscriptions'::TEXT, COUNT(*)::BIGINT FROM push_subscriptions WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STATISTICS & MONITORING
-- ============================================================================

-- Function to get database health metrics
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT,
  status TEXT
) AS $$
BEGIN
  -- Total users
  RETURN QUERY
  SELECT 
    'Total Users'::TEXT,
    COUNT(*)::TEXT,
    'INFO'::TEXT
  FROM profiles;

  -- Active users (last 30 days)
  RETURN QUERY
  SELECT 
    'Active Users (30d)'::TEXT,
    COUNT(DISTINCT author_id)::TEXT,
    'INFO'::TEXT
  FROM posts
  WHERE created_at > NOW() - INTERVAL '30 days';

  -- Total storage size
  RETURN QUERY
  SELECT 
    'Database Size'::TEXT,
    pg_size_pretty(pg_database_size(current_database())),
    'INFO'::TEXT;

  -- Largest tables
  RETURN QUERY
  SELECT 
    'Largest Table'::TEXT,
    tablename || ' (' || pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) || ')',
    'INFO'::TEXT
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKUP VERIFICATION
-- ============================================================================

COMMENT ON FUNCTION create_data_snapshot() IS 'Creates a snapshot of row counts for all critical tables';
COMMENT ON FUNCTION check_data_integrity() IS 'Checks for orphaned records and data integrity issues';
COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS 'Cleans up old data older than specified days (default 90)';
COMMENT ON FUNCTION get_database_health() IS 'Returns database health metrics and statistics';

-- Run initial health check
SELECT * FROM get_database_health();

-- Show data snapshot
SELECT * FROM create_data_snapshot();

-- Check data integrity
SELECT * FROM check_data_integrity();
