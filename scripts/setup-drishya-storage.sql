-- Drishya Storage Buckets and Policies Setup
-- Creates all necessary storage infrastructure for video platform

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Private bucket for raw video uploads (100MB limit)
  ('drishya-uploads', 'drishya-uploads', false, 104857600, ARRAY[
    'video/mp4', 
    'video/quicktime', 
    'video/x-msvideo', 
    'video/webm',
    'video/avi'
  ]),
  
  -- Public bucket for HLS streaming files (no size limit)
  ('drishya-stream', 'drishya-stream', true, null, ARRAY[
    'video/mp4',
    'application/x-mpegURL',
    'video/MP2T',
    'application/vnd.apple.mpegurl'
  ]),
  
  -- Public bucket for video thumbnails (5MB limit)
  ('drishya-thumbs', 'drishya-thumbs', true, 5242880, ARRAY[
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ]),
  
  -- Public bucket for audio tracks (10MB limit)
  ('drishya-audio', 'drishya-audio', true, 10485760, ARRAY[
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/mp4',
    'audio/ogg'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for drishya-uploads (private bucket)
CREATE POLICY "drishya_uploads_user_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'drishya-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "drishya_uploads_user_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'drishya-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "drishya_uploads_user_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'drishya-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "drishya_uploads_service_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'drishya-uploads' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- RLS Policies for drishya-stream (public bucket)
CREATE POLICY "drishya_stream_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'drishya-stream');

CREATE POLICY "drishya_stream_service_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'drishya-stream' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- RLS Policies for drishya-thumbs (public bucket)
CREATE POLICY "drishya_thumbs_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'drishya-thumbs');

CREATE POLICY "drishya_thumbs_service_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'drishya-thumbs' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- RLS Policies for drishya-audio (public bucket)
CREATE POLICY "drishya_audio_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'drishya-audio');

CREATE POLICY "drishya_audio_service_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'drishya-audio' 
  AND auth.jwt() ->> 'role' = 'service_role'
);
