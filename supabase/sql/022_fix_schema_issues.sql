-- Fix any schema issues identified by the migration check
-- This script addresses common discrepancies between expected and actual schema

-- 1. Ensure all tables exist with correct structure
-- Fix posts table if columns are missing or misnamed
DO $$ 
BEGIN
  -- Check if posts table has 'body' column instead of 'content'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'body'
  ) THEN
    -- Add body column if missing
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS body TEXT;
    
    -- If content column exists, copy data and drop it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'content'
    ) THEN
      UPDATE posts SET body = content WHERE body IS NULL;
      ALTER TABLE posts DROP COLUMN IF EXISTS content;
    END IF;
  END IF;

  -- Ensure posts table has correct column names
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE posts RENAME COLUMN user_id TO author_id;
  END IF;

  -- Fix column name mismatches
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE posts RENAME COLUMN likes_count TO like_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE posts RENAME COLUMN comments_count TO comment_count;
  END IF;

  -- Ensure profiles table has correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
    
    -- Copy from full_name if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'full_name'
    ) THEN
      UPDATE profiles SET name = full_name WHERE name IS NULL;
    END IF;
  END IF;

END $$;

-- 2. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden) WHERE is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_reels_author_id ON reels(author_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- 3. Add missing foreign key constraints
DO $$
BEGIN
  -- Posts to profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_author_id_fkey'
  ) THEN
    ALTER TABLE posts 
    ADD CONSTRAINT posts_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Post likes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_likes_post_id_fkey'
  ) THEN
    ALTER TABLE post_likes 
    ADD CONSTRAINT post_likes_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_likes_user_id_fkey'
  ) THEN
    ALTER TABLE post_likes 
    ADD CONSTRAINT post_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Post comments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_post_id_fkey'
  ) THEN
    ALTER TABLE post_comments 
    ADD CONSTRAINT post_comments_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_author_id_fkey'
  ) THEN
    ALTER TABLE post_comments 
    ADD CONSTRAINT post_comments_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

END $$;

-- 4. Update any missing default values
ALTER TABLE posts ALTER COLUMN like_count SET DEFAULT 0;
ALTER TABLE posts ALTER COLUMN comment_count SET DEFAULT 0;
ALTER TABLE posts ALTER COLUMN is_hidden SET DEFAULT false;

ALTER TABLE reels ALTER COLUMN likes SET DEFAULT 0;
ALTER TABLE reels ALTER COLUMN views SET DEFAULT 0;
ALTER TABLE reels ALTER COLUMN is_hidden SET DEFAULT false;

ALTER TABLE profiles ALTER COLUMN is_admin SET DEFAULT false;
ALTER TABLE profiles ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE profiles ALTER COLUMN shadow_muted SET DEFAULT false;

-- 5. Add any missing triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables that need updated_at triggers
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 7. Create basic RLS policies if they don't exist
DO $$
BEGIN
  -- Profiles: users can read all, update own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles" ON profiles
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Posts: users can read non-hidden, create own, update/delete own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can view non-hidden posts'
  ) THEN
    CREATE POLICY "Users can view non-hidden posts" ON posts
      FOR SELECT USING (NOT is_hidden);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can create posts'
  ) THEN
    CREATE POLICY "Users can create posts" ON posts
      FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can update own posts'
  ) THEN
    CREATE POLICY "Users can update own posts" ON posts
      FOR UPDATE USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can delete own posts'
  ) THEN
    CREATE POLICY "Users can delete own posts" ON posts
      FOR DELETE USING (auth.uid() = author_id);
  END IF;

END $$;

-- 8. Add any missing enums
DO $$
BEGIN
  -- Create enums if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'captured', 'failed', 'refunded');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draw_status') THEN
    CREATE TYPE draw_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_status') THEN
    CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'rejected');
  END IF;

END $$;

-- Final verification
SELECT 'Schema fix completed' as status, NOW() as timestamp;
