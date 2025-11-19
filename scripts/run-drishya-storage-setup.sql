-- Execute Drishya Storage Setup
-- This script runs the complete storage setup for the Drishya video platform

\echo '🎬 Starting Drishya Storage Setup...'
\echo ''

-- Create storage buckets for Drishya
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'drishya-uploads',
    'drishya-uploads',
    false,
    104857600, -- 100MB limit for raw uploads
    ARRAY[
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/3gpp'
    ]
  ),
  (
    'drishya-stream',
    'drishya-stream', 
    true,
    null, -- No limit for processed streaming files
    ARRAY[
      'video/mp4',
      'video/webm',
      'application/x-mpegURL', -- HLS playlists
      'video/MP2T', -- HLS segments
      'application/dash+xml' -- DASH manifests
    ]
  ),
  (
    'drishya-thumbs',
    'drishya-thumbs',
    true,
    5242880, -- 5MB limit for thumbnails
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
  ),
  (
    'drishya-audio',
    'drishya-audio',
    true,
    10485760, -- 10MB limit for audio
    ARRAY[
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/webm'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '📁 Storage buckets created successfully!'

-- Create storage policies for drishya-uploads (private bucket)
CREATE POLICY "Users can upload to their own folder in drishya-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'drishya-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own uploads in drishya-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'drishya-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own uploads in drishya-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'drishya-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can manage all drishya-uploads"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'drishya-uploads');

-- Create storage policies for drishya-stream (public bucket)
CREATE POLICY "Public read access for drishya-stream"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'drishya-stream');

CREATE POLICY "Service role can manage drishya-stream"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'drishya-stream');

-- Create storage policies for drishya-thumbs (public bucket)
CREATE POLICY "Public read access for drishya-thumbs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'drishya-thumbs');

CREATE POLICY "Service role can manage drishya-thumbs"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'drishya-thumbs');

-- Create storage policies for drishya-audio (public bucket)
CREATE POLICY "Public read access for drishya-audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'drishya-audio');

CREATE POLICY "Service role can manage drishya-audio"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'drishya-audio');

\echo '🔒 Storage policies created successfully!'
\echo ''
\echo '✅ Drishya Storage Setup Complete!'
\echo ''
\echo 'Created buckets:'
\echo '  - drishya-uploads (private, 100MB, 5 video formats)'
\echo '  - drishya-stream (public, unlimited, HLS formats)'
\echo '  - drishya-thumbs (public, 5MB, 4 image formats)'
\echo '  - drishya-audio (public, 10MB, 5 audio formats)'
\echo ''
\echo 'Applied 10 security policies for proper access control.'
\echo ''
\echo '🎬 Ready for video uploads and streaming!'
