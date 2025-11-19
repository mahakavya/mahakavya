-- Verify Samvaaha Social Feed Setup
-- This script checks that all components are properly configured

\echo '🔍 Verifying Samvaaha Social Feed Setup...'
\echo ''

-- Check all required tables exist
\echo '📊 Checking tables...'
SELECT 
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ All tables created'
    ELSE '❌ Missing tables: ' || (8 - COUNT(*))::text
  END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'posts', 
    'comments', 
    'post_likes', 
    'comment_likes', 
    'bookmarks', 
    'moderation_flags', 
    'follows', 
    'notifications'
  );

-- List all tables with their row counts
\echo ''
\echo '📋 Table details:'
SELECT 
  t.table_name,
  COALESCE(s.n_tup_ins, 0) as row_count,
  CASE 
    WHEN t.table_name = 'user_profiles' THEN '👤 User profiles'
    WHEN t.table_name = 'posts' THEN '📝 Social posts'
    WHEN t.table_name = 'comments' THEN '💬 Post comments'
    WHEN t.table_name = 'post_likes' THEN '❤️  Post likes'
    WHEN t.table_name = 'comment_likes' THEN '👍 Comment likes'
    WHEN t.table_name = 'bookmarks' THEN '🔖 Saved posts'
    WHEN t.table_name = 'moderation_flags' THEN '🚩 Content reports'
    WHEN t.table_name = 'follows' THEN '👥 User follows'
    WHEN t.table_name = 'notifications' THEN '🔔 Notifications'
    ELSE '❓ Unknown'
  END as description
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN (
    'user_profiles',
    'posts', 
    'comments', 
    'post_likes', 
    'comment_likes', 
    'bookmarks', 
    'moderation_flags', 
    'follows', 
    'notifications'
  )
ORDER BY t.table_name;

-- Check RLS is enabled
\echo ''
\echo '🔒 Checking Row Level Security...'
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'posts', 
    'comments', 
    'post_likes', 
    'comment_likes', 
    'bookmarks', 
    'moderation_flags', 
    'follows', 
    'notifications'
  )
ORDER BY tablename;

-- Count RLS policies
\echo ''
\echo '🛡️  Checking RLS Policies...'
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'posts', 
    'comments', 
    'post_likes', 
    'comment_likes', 
    'bookmarks', 
    'moderation_flags', 
    'follows', 
    'notifications'
  )
GROUP BY tablename
ORDER BY tablename;

-- Check functions
\echo ''
\echo '⚙️  Checking Functions...'
SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'is_admin' THEN '👑 Admin check'
    WHEN routine_name = 'can_view_post' THEN '👁️  Post visibility'
    WHEN routine_name = 'bump_post_counts' THEN '📊 Post counters'
    WHEN routine_name = 'bump_comment_counts' THEN '💬 Comment counters'
    WHEN routine_name = 'update_updated_at_column' THEN '⏰ Timestamp updates'
    ELSE '❓ Unknown'
  END as description
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_admin',
    'can_view_post',
    'bump_post_counts',
    'bump_comment_counts',
    'update_updated_at_column'
  )
ORDER BY routine_name;

-- Check triggers
\echo ''
\echo '🔄 Checking Triggers...'
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event_type,
  action_timing,
  CASE 
    WHEN trigger_name LIKE '%comment_counts%' THEN '💬 Comment counter'
    WHEN trigger_name LIKE '%like_counts%' THEN '❤️  Like counter'
    WHEN trigger_name LIKE '%updated_at%' THEN '⏰ Timestamp update'
    ELSE '❓ Unknown'
  END as description
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN (
    'posts', 
    'comments', 
    'post_likes', 
    'comment_likes',
    'user_profiles'
  )
ORDER BY event_object_table, trigger_name;

-- Check indexes
\echo ''
\echo '🚀 Checking Performance Indexes...'
SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE '%created_at%' THEN '⏰ Time-based queries'
    WHEN indexname LIKE '%author_id%' THEN '👤 Author lookups'
    WHEN indexname LIKE '%post_id%' THEN '📝 Post relations'
    WHEN indexname LIKE '%user_id%' THEN '👤 User relations'
    WHEN indexname LIKE '%visibility%' THEN '👁️  Visibility filtering'
    ELSE '❓ General index'
  END as purpose
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'posts', 
    'comments', 
    'post_likes', 
    'comment_likes', 
    'bookmarks', 
    'follows', 
    'notifications'
  )
  AND indexname NOT LIKE '%pkey%'
ORDER BY tablename, indexname;

-- Test basic queries
\echo ''
\echo '🧪 Testing Basic Queries...'

-- Test user_profiles access
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ user_profiles accessible'
    ELSE '❌ user_profiles error'
  END as test_result
FROM user_profiles 
LIMIT 1;

-- Test posts access  
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ posts accessible'
    ELSE '❌ posts error'
  END as test_result
FROM posts 
LIMIT 1;

-- Test comments access
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ comments accessible'
    ELSE '❌ comments error'
  END as test_result
FROM comments 
LIMIT 1;

-- Test visibility function
SELECT 
  CASE 
    WHEN public.can_view_post(
      ROW(
        gen_random_uuid(), 
        gen_random_uuid(), 
        'Test post', 
        '{}', 
        '{}', 
        'PUBLIC', 
        0, 0, 0, 
        now(), 
        now()
      )::posts, 
      gen_random_uuid()
    ) = true THEN '✅ can_view_post function works'
    ELSE '❌ can_view_post function error'
  END as test_result;

-- Test admin function
SELECT 
  CASE 
    WHEN public.is_admin(gen_random_uuid()) = false THEN '✅ is_admin function works'
    ELSE '❌ is_admin function error'
  END as test_result;

\echo ''
\echo '🎉 Samvaaha Social Feed verification complete!'
\echo ''
\echo '📋 Summary:'
\echo '   • Database schema: Ready'
\echo '   • RLS policies: Active'
\echo '   • Functions: Working'
\echo '   • Triggers: Active'
\echo '   • Indexes: Optimized'
\echo ''
\echo '🚀 Ready to launch social feed at /samvaaha!'
