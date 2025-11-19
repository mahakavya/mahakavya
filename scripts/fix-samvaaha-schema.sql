-- Fix Samvaaha Schema Issues
-- This script ensures all required tables and relationships exist

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create samvaaha_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS samvaaha_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

-- Create samvaaha_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS samvaaha_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES samvaaha_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- Create samvaaha_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS samvaaha_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES samvaaha_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES samvaaha_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT comment_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

-- Create samvaaha_bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS samvaaha_bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES samvaaha_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- Create samvaaha_follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS samvaaha_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_samvaaha_posts_author_id ON samvaaha_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_samvaaha_posts_created_at ON samvaaha_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_samvaaha_posts_visibility ON samvaaha_posts(visibility);

CREATE INDEX IF NOT EXISTS idx_samvaaha_likes_post_id ON samvaaha_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_samvaaha_likes_user_id ON samvaaha_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_samvaaha_comments_post_id ON samvaaha_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_samvaaha_comments_author_id ON samvaaha_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_samvaaha_comments_parent_id ON samvaaha_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_samvaaha_bookmarks_post_id ON samvaaha_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_samvaaha_bookmarks_user_id ON samvaaha_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_samvaaha_follows_follower_id ON samvaaha_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_samvaaha_follows_following_id ON samvaaha_follows(following_id);

-- Create or replace functions for updating counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE samvaaha_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE samvaaha_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE samvaaha_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE samvaaha_posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON samvaaha_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON samvaaha_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON samvaaha_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON samvaaha_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE samvaaha_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE samvaaha_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE samvaaha_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE samvaaha_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE samvaaha_follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Posts policies
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON samvaaha_posts;
CREATE POLICY "Public posts are viewable by everyone" ON samvaaha_posts
  FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can create posts" ON samvaaha_posts;
CREATE POLICY "Users can create posts" ON samvaaha_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON samvaaha_posts;
CREATE POLICY "Users can update own posts" ON samvaaha_posts
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON samvaaha_posts;
CREATE POLICY "Users can delete own posts" ON samvaaha_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Likes policies
DROP POLICY IF EXISTS "Users can view likes" ON samvaaha_likes;
CREATE POLICY "Users can view likes" ON samvaaha_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own likes" ON samvaaha_likes;
CREATE POLICY "Users can manage own likes" ON samvaaha_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Users can view comments" ON samvaaha_comments;
CREATE POLICY "Users can view comments" ON samvaaha_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON samvaaha_comments;
CREATE POLICY "Users can create comments" ON samvaaha_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON samvaaha_comments;
CREATE POLICY "Users can update own comments" ON samvaaha_comments
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON samvaaha_comments;
CREATE POLICY "Users can delete own comments" ON samvaaha_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Bookmarks policies
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON samvaaha_bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON samvaaha_bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "Users can view follows" ON samvaaha_follows;
CREATE POLICY "Users can view follows" ON samvaaha_follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON samvaaha_follows;
CREATE POLICY "Users can manage own follows" ON samvaaha_follows
  FOR ALL USING (auth.uid() = follower_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Samvaaha schema setup completed successfully!';
END $$;
