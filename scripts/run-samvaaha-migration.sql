-- Run the Samvaaha social feed migration
-- This script executes the complete social media database setup

\echo 'Starting Samvaaha Social Feed Migration...'

-- Execute the migration
\i supabase/migrations/043_samvaaha_social_feed.sql

\echo 'Samvaaha Social Feed Migration completed successfully!'

-- Verify the tables were created
\echo 'Verifying table creation...'

SELECT 
  schemaname,
  tablename,
  tableowner
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

\echo 'Checking RLS policies...'

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
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
ORDER BY tablename, policyname;

\echo 'Checking indexes...'

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
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
ORDER BY tablename, indexname;

\echo 'Checking functions...'

SELECT 
  routine_name,
  routine_type,
  data_type
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

\echo 'Checking triggers...'

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
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

\echo 'Migration verification complete!'
