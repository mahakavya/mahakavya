-- Check current database schema against expected schema
-- This script helps identify missing tables, columns, or inconsistencies

-- 1. Check if all expected tables exist
SELECT 
  'Missing Table' as issue_type,
  expected_table as table_name,
  NULL as column_name,
  'Table does not exist in database' as description
FROM (
  VALUES 
    ('profiles'),
    ('posts'),
    ('post_likes'),
    ('post_comments'),
    ('reels'),
    ('reel_likes'),
    ('campaigns'),
    ('donations'),
    ('draws'),
    ('entries'),
    ('conversations'),
    ('conversation_members'),
    ('messages'),
    ('listeners'),
    ('slots'),
    ('sessions'),
    ('subscriptions'),
    ('payments'),
    ('notifications'),
    ('notification_prefs'),
    ('push_subscriptions'),
    ('push_tokens'),
    ('events'),
    ('audit_logs'),
    ('reports'),
    ('safety_flags'),
    ('rate_events'),
    ('presence'),
    ('feature_access'),
    ('delete_requests'),
    ('doc_counters')
) AS expected(expected_table)
WHERE expected_table NOT IN (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
);

-- 2. Check for missing columns in critical tables
WITH expected_columns AS (
  SELECT 'profiles' as table_name, 'id' as column_name, 'uuid' as expected_type
  UNION ALL SELECT 'profiles', 'email', 'text'
  UNION ALL SELECT 'profiles', 'name', 'text'
  UNION ALL SELECT 'profiles', 'avatar_url', 'text'
  UNION ALL SELECT 'profiles', 'is_admin', 'boolean'
  UNION ALL SELECT 'profiles', 'is_active', 'boolean'
  UNION ALL SELECT 'profiles', 'created_at', 'timestamp with time zone'
  UNION ALL SELECT 'profiles', 'updated_at', 'timestamp with time zone'
  
  UNION ALL SELECT 'posts', 'id', 'uuid'
  UNION ALL SELECT 'posts', 'author_id', 'uuid'
  UNION ALL SELECT 'posts', 'body', 'text'
  UNION ALL SELECT 'posts', 'media_urls', 'ARRAY'
  UNION ALL SELECT 'posts', 'tags', 'ARRAY'
  UNION ALL SELECT 'posts', 'like_count', 'integer'
  UNION ALL SELECT 'posts', 'comment_count', 'integer'
  UNION ALL SELECT 'posts', 'is_hidden', 'boolean'
  UNION ALL SELECT 'posts', 'created_at', 'timestamp with time zone'
  UNION ALL SELECT 'posts', 'updated_at', 'timestamp with time zone'
)
SELECT 
  'Missing Column' as issue_type,
  ec.table_name,
  ec.column_name,
  'Expected column missing: ' || ec.column_name || ' (' || ec.expected_type || ')' as description
FROM expected_columns ec
LEFT JOIN information_schema.columns ic ON (
  ic.table_schema = 'public' 
  AND ic.table_name = ec.table_name 
  AND ic.column_name = ec.column_name
)
WHERE ic.column_name IS NULL
  AND ec.table_name IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  );

-- 3. Check for data type mismatches
WITH expected_columns AS (
  SELECT 'profiles' as table_name, 'id' as column_name, 'uuid' as expected_type
  UNION ALL SELECT 'profiles', 'is_admin', 'boolean'
  UNION ALL SELECT 'profiles', 'is_active', 'boolean'
  UNION ALL SELECT 'posts', 'like_count', 'integer'
  UNION ALL SELECT 'posts', 'comment_count', 'integer'
  UNION ALL SELECT 'posts', 'is_hidden', 'boolean'
)
SELECT 
  'Type Mismatch' as issue_type,
  ic.table_name,
  ic.column_name,
  'Expected: ' || ec.expected_type || ', Found: ' || ic.data_type as description
FROM expected_columns ec
JOIN information_schema.columns ic ON (
  ic.table_schema = 'public' 
  AND ic.table_name = ec.table_name 
  AND ic.column_name = ec.column_name
)
WHERE ic.data_type != ec.expected_type;

-- 4. Check for missing indexes on critical columns
SELECT 
  'Missing Index' as issue_type,
  'posts' as table_name,
  'author_id' as column_name,
  'Missing index on posts.author_id for performance' as description
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename = 'posts' 
  AND indexname LIKE '%author_id%'
);

-- 5. Check for missing foreign key constraints
SELECT 
  'Missing FK' as issue_type,
  tc.table_name,
  kcu.column_name,
  'Missing foreign key constraint' as description
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON (
  tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
)
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'posts'
  AND kcu.column_name = 'author_id'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    WHERE rc.constraint_name = tc.constraint_name
  );

-- 6. Summary of database state
SELECT 
  'Summary' as issue_type,
  'Database' as table_name,
  NULL as column_name,
  'Total tables: ' || COUNT(*) as description
FROM information_schema.tables 
WHERE table_schema = 'public';
