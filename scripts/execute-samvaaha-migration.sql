-- Execute Samvaaha Social Feed Migration
-- This runs the complete migration from supabase/migrations/043_samvaaha_social_feed.sql

\echo '🚀 Executing Samvaaha Social Feed Migration...'
\echo ''

-- Start transaction
BEGIN;

-- Create posts table with comprehensive social media features
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'FOLLOWERS', 'PRIVATE')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create comments table with threading support
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create moderation flags table
CREATE TABLE IF NOT EXISTS moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'POST')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

\echo '✅ Tables created successfully!'

-- Create utility functions
\echo '⚙️  Creating utility functions...'

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
    AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view a post
CREATE OR REPLACE FUNCTION can_view_post(post posts, viewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Public posts are visible to everyone
  IF post.visibility = 'PUBLIC' THEN
    RETURN true;
  END IF;
  
  -- Private posts only visible to author
  IF post.visibility = 'PRIVATE' THEN
    RETURN post.author_id = viewer_id;
  END IF;
  
  -- Followers-only posts visible to author and followers
  IF post.visibility = 'FOLLOWERS' THEN
    RETURN post.author_id = viewer_id OR EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = viewer_id 
      AND following_id = post.author_id
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post counts
CREATE OR REPLACE FUNCTION bump_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION bump_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post comment count
    UPDATE posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
    
    -- Update comment like count if it's a comment like
    IF TG_TABLE_NAME = 'comment_likes' THEN
      UPDATE comments 
      SET like_count = like_count + 1 
      WHERE id = NEW.comment_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post comment count
    IF TG_TABLE_NAME = 'comments' THEN
      UPDATE posts 
      SET comment_count = comment_count - 1 
      WHERE id = OLD.post_id;
    END IF;
    
    -- Update comment like count if it's a comment like
    IF TG_TABLE_NAME = 'comment_likes' THEN
      UPDATE comments 
      SET like_count = like_count - 1 
      WHERE id = OLD.comment_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Functions created successfully!'

-- Create triggers
\echo '🔄 Creating triggers...'

-- Triggers for post likes
CREATE TRIGGER post_like_counts_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION bump_post_counts();

-- Triggers for comments
CREATE TRIGGER comment_counts_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION bump_comment_counts();

-- Triggers for comment likes
CREATE TRIGGER comment_like_counts_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION bump_comment_counts();

-- Triggers for updated_at timestamps
CREATE TRIGGER posts_updated_at_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER comments_updated_at_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo '✅ Triggers created successfully!'

-- Enable Row Level Security
\echo '🔒 Enabling Row Level Security...'

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

\echo '✅ RLS enabled successfully!'

-- Create RLS policies
\echo '🛡️  Creating RLS policies...'

-- Posts policies
CREATE POLICY "Posts are viewable based on visibility" ON posts
  FOR SELECT USING (can_view_post(posts, auth.uid()));

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts" ON posts
  FOR ALL USING (is_admin(auth.uid()));

-- Comments policies
CREATE POLICY "Comments are viewable if post is viewable" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can create comments on viewable posts" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all comments" ON comments
  FOR ALL USING (is_admin(auth.uid()));

-- Post likes policies
CREATE POLICY "Post likes are viewable if post is viewable" ON post_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_likes.post_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can like viewable posts" ON post_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_likes.post_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can unlike their own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Comment likes are viewable if comment is viewable" ON comment_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comments 
      JOIN posts ON posts.id = comments.post_id
      WHERE comments.id = comment_likes.comment_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can like viewable comments" ON comment_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM comments 
      JOIN posts ON posts.id = comments.post_id
      WHERE comments.id = comment_likes.comment_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can unlike their own comment likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark viewable posts" ON bookmarks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = bookmarks.post_id 
      AND can_view_post(posts, auth.uid())
    )
  );

CREATE POLICY "Users can remove their own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Moderation flags policies
CREATE POLICY "Users can view their own flags" ON moderation_flags
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all flags" ON moderation_flags
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can flag content" ON moderation_flags
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage flags" ON moderation_flags
  FOR UPDATE USING (is_admin(auth.uid()));

-- Follows policies
CREATE POLICY "Follows are publicly viewable" ON follows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow others" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

\echo '✅ RLS policies created successfully!'

-- Create performance indexes
\echo '🚀 Creating performance indexes...'

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

\echo '✅ Indexes created successfully!'

-- Commit transaction
COMMIT;

\echo ''
\echo '🎉 Samvaaha Social Feed Migration completed successfully!'
\echo ''
\echo '📊 Database Schema Summary:'
\echo '   • posts: Main social media content'
\echo '   • comments: Threaded discussions'
\echo '   • post_likes: Post engagement'
\echo '   • comment_likes: Comment engagement'
\echo '   • bookmarks: Saved content'
\echo '   • moderation_flags: Content reporting'
\echo '   • follows: User relationships'
\echo '   • notifications: Real-time alerts'
\echo ''
\echo '🔐 Security Features:'
\echo '   • Row Level Security enabled'
\echo '   • Comprehensive access policies'
\echo '   • Visibility controls (PUBLIC/FOLLOWERS/PRIVATE)'
\echo '   • Admin moderation capabilities'
\echo ''
\echo '⚡ Performance Features:'
\echo '   • Strategic database indexes'
\echo '   • Automatic counter updates'
\echo '   • Optimized query patterns'
\echo ''
\echo '🚀 Ready to launch social feed!'
