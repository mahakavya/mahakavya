-- Drishya Storage Verification Script
-- This script verifies that all storage buckets and policies are properly configured

DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
    upload_bucket_exists BOOLEAN := FALSE;
    stream_bucket_exists BOOLEAN := FALSE;
    thumbs_bucket_exists BOOLEAN := FALSE;
    audio_bucket_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '🎬 DRISHYA STORAGE VERIFICATION STARTING...';
    RAISE NOTICE '';

    -- Check if storage buckets exist
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
    RAISE NOTICE '📁 Total Storage Buckets: %', bucket_count;

    -- Check specific buckets
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'drishya-uploads') INTO upload_bucket_exists;
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'drishya-stream') INTO stream_bucket_exists;
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'drishya-thumbs') INTO thumbs_bucket_exists;
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'drishya-audio') INTO audio_bucket_exists;

    RAISE NOTICE '';
    RAISE NOTICE '📂 BUCKET STATUS:';
    RAISE NOTICE '   drishya-uploads: %', CASE WHEN upload_bucket_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   drishya-stream:  %', CASE WHEN stream_bucket_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   drishya-thumbs:  %', CASE WHEN thumbs_bucket_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   drishya-audio:   %', CASE WHEN audio_bucket_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;

    -- Check bucket configurations
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  BUCKET CONFIGURATIONS:';
    
    FOR rec IN 
        SELECT 
            id,
            public,
            file_size_limit,
            allowed_mime_types
        FROM storage.buckets 
        WHERE id LIKE 'drishya-%'
        ORDER BY id
    LOOP
        RAISE NOTICE '   %:', rec.id;
        RAISE NOTICE '     Public: %', CASE WHEN rec.public THEN 'Yes' ELSE 'No' END;
        RAISE NOTICE '     Size Limit: %', COALESCE(rec.file_size_limit::text, 'Unlimited');
        RAISE NOTICE '     MIME Types: %', COALESCE(array_length(rec.allowed_mime_types, 1)::text, '0') || ' types';
    END LOOP;

    -- Check storage policies
    SELECT COUNT(*) INTO policy_count 
    FROM storage.policies 
    WHERE bucket_id LIKE 'drishya-%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SECURITY POLICIES:';
    RAISE NOTICE '   Total Drishya Policies: %', policy_count;

    -- List all policies
    FOR rec IN 
        SELECT 
            bucket_id,
            name,
            definition,
            check_expression
        FROM storage.policies 
        WHERE bucket_id LIKE 'drishya-%'
        ORDER BY bucket_id, name
    LOOP
        RAISE NOTICE '   % - %', rec.bucket_id, rec.name;
    END LOOP;

    -- Check if reels table exists
    RAISE NOTICE '';
    RAISE NOTICE '🗄️  DATABASE TABLES:';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reels') THEN
        RAISE NOTICE '   reels table: ✅ EXISTS';
        
        -- Check reel counts
        DECLARE
            reel_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO reel_count FROM reels;
            RAISE NOTICE '   Total reels: %', reel_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '   Total reels: Unable to count (permissions)';
        END;
    ELSE
        RAISE NOTICE '   reels table: ❌ MISSING';
    END IF;

    -- Check if reel_comments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reel_comments') THEN
        RAISE NOTICE '   reel_comments table: ✅ EXISTS';
    ELSE
        RAISE NOTICE '   reel_comments table: ❌ MISSING';
    END IF;

    -- Check if reel_likes table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reel_likes') THEN
        RAISE NOTICE '   reel_likes table: ✅ EXISTS';
    ELSE
        RAISE NOTICE '   reel_likes table: ❌ MISSING';
    END IF;

    -- Final status
    RAISE NOTICE '';
    RAISE NOTICE '🎯 VERIFICATION SUMMARY:';
    
    IF upload_bucket_exists AND stream_bucket_exists AND thumbs_bucket_exists AND audio_bucket_exists THEN
        RAISE NOTICE '   Storage Buckets: ✅ ALL CONFIGURED';
    ELSE
        RAISE NOTICE '   Storage Buckets: ❌ SOME MISSING';
    END IF;
    
    IF policy_count >= 8 THEN
        RAISE NOTICE '   Security Policies: ✅ PROPERLY CONFIGURED';
    ELSE
        RAISE NOTICE '   Security Policies: ⚠️  INCOMPLETE (% policies)', policy_count;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎬 DRISHYA VERIFICATION COMPLETE!';
    
END $$;
