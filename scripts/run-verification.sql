-- Samvaaha Social Feed Setup Verification
-- This script verifies that all tables, functions, policies, and indexes are properly created

\echo 'Starting Samvaaha Social Feed Verification...'

-- Check if all required tables exist
\echo 'Checking table existence...'
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications')
ORDER BY table_name;

-- Check RLS is enabled on all tables
\echo 'Checking Row Level Security status...'
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications')
ORDER BY tablename;

-- Check if required functions exist
\echo 'Checking database functions...'
SELECT 
    routine_name,
    '✅ FUNCTION EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'can_view_post', 'bump_post_counts', 'bump_comment_counts', 'update_updated_at_column')
ORDER BY routine_name;

-- Check if indexes are created
\echo 'Checking database indexes...'
SELECT 
    indexname,
    tablename,
    '✅ INDEX EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications')
ORDER BY tablename, indexname;

-- Check if triggers are created
\echo 'Checking database triggers...'
SELECT 
    trigger_name,
    event_object_table,
    '✅ TRIGGER EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('posts', 'comments', 'post_likes', 'comment_likes')
ORDER BY event_object_table, trigger_name;

-- Check RLS policies
\echo 'Checking RLS policies...'
SELECT 
    schemaname,
    tablename,
    policyname,
    '✅ POLICY EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications')
ORDER BY tablename, policyname;

-- Test basic functionality
\echo 'Testing basic functionality...'

-- Test posts table structure
\echo 'Verifying posts table structure...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test comments table structure
\echo 'Verifying comments table structure...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
\echo 'Checking foreign key constraints...'
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ CONSTRAINT EXISTS' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications')
ORDER BY tc.table_name, tc.constraint_name;

-- Test function execution (safe functions only)
\echo 'Testing function execution...'
SELECT 
    'is_admin function' as test_name,
    CASE 
        WHEN is_admin('00000000-0000-0000-0000-000000000000'::uuid) IS NOT NULL 
        THEN '✅ FUNCTION WORKS'
        ELSE '❌ FUNCTION ERROR'
    END as status;

-- Check enum types
\echo 'Checking enum types...'
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values,
    '✅ ENUM EXISTS' as status
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('post_visibility', 'notification_type', 'flag_reason')
GROUP BY t.typname
ORDER BY t.typname;

-- Summary
\echo 'Verification Summary:'
\echo '==================='

-- Count tables
SELECT 
    'Tables Created' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ COMPLETE'
        ELSE '❌ INCOMPLETE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications');

-- Count functions
SELECT 
    'Functions Created' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ COMPLETE'
        ELSE '❌ INCOMPLETE'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'can_view_post', 'bump_post_counts', 'bump_comment_counts', 'update_updated_at_column');

-- Count policies
SELECT 
    'RLS Policies Created' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ COMPLETE'
        ELSE '❌ NEEDS REVIEW'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications');

-- Count indexes
SELECT 
    'Indexes Created' as component,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 15 THEN '✅ COMPLETE'
        ELSE '❌ NEEDS REVIEW'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'comments', 'post_likes', 'comment_likes', 'bookmarks', 'moderation_flags', 'follows', 'notifications');

\echo 'Samvaaha Social Feed Verification Complete!'
\echo '==========================================='
