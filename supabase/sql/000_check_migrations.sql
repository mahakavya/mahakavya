-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Check which migrations have been applied
SELECT version, applied_at, description 
FROM schema_migrations 
ORDER BY version;

-- Expected migrations list
INSERT INTO schema_migrations (version, description) VALUES
('001_schema', 'Initial database schema with all tables')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('002_rls', 'Row Level Security policies')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('003_indexes', 'Database indexes for performance')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('004_functions', 'Database functions and triggers')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('005_search', 'Full-text search setup')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('006_analytics', 'Analytics and monitoring tables')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('007_notifications', 'Notification system')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('008_safety', 'Content safety and moderation')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('009_rate_limits', 'Rate limiting system')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('010_push', 'Push notification subscriptions')
ON CONFLICT (version) DO NOTHING;

-- Show pending migrations
WITH expected_migrations AS (
  SELECT unnest(ARRAY[
    '001_schema',
    '002_rls', 
    '003_indexes',
    '004_functions',
    '005_search',
    '006_analytics',
    '007_notifications',
    '008_safety',
    '009_rate_limits',
    '010_push'
  ]) AS version
)
SELECT 
  em.version,
  CASE 
    WHEN sm.version IS NULL THEN 'PENDING'
    ELSE 'APPLIED'
  END AS status
FROM expected_migrations em
LEFT JOIN schema_migrations sm ON em.version = sm.version
ORDER BY em.version;
