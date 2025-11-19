-- Create storage buckets for the social media platform

-- Posts bucket for feed images and videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  26214400, -- 25MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Reels bucket for video content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reels',
  'reels',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Chat bucket for private attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat',
  'chat',
  false, -- Private bucket
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Campaigns bucket for fundraising cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaigns',
  'campaigns',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for Posts bucket
CREATE POLICY "Users can upload to their own folder in posts bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Posts are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own posts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for Reels bucket
CREATE POLICY "Users can upload to their own folder in reels bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'reels' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Reels are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'reels');

CREATE POLICY "Users can update their own reels" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'reels' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own reels" ON storage.objects
FOR DELETE USING (
  bucket_id = 'reels' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for Chat bucket (private)
CREATE POLICY "Users can upload to their own folder in chat bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can only view their own chat files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own chat files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for Campaigns bucket
CREATE POLICY "Users can upload to their own folder in campaigns bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'campaigns' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Campaign covers are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'campaigns');

CREATE POLICY "Users can update their own campaign covers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'campaigns' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own campaign covers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'campaigns' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner ON storage.objects(owner);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
