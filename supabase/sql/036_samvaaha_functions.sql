-- Samvaaha Feed Functions and Enhancements

-- Function to get personalized feed for a user
CREATE OR REPLACE FUNCTION get_personalized_feed(
  user_id_param UUID,
  feed_type TEXT DEFAULT 'for-you',
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  author_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  hashtags TEXT[],
  ai_score DECIMAL,
  blockchain_verified BOOLEAN,
  rpa_optimized BOOLEAN,
  media_url TEXT,
  visibility TEXT,
  is_liked BOOLEAN,
  is_bookmarked BOOLEAN
) AS $$
BEGIN
  CASE feed_type
    WHEN 'following' THEN
      RETURN QUERY
      SELECT 
        p.id,
        p.content,
        p.author_id,
        pr.name as author_name,
        pr.avatar_url as author_avatar,
        pr.verified as author_verified,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        p.hashtags,
        p.ai_score,
        p.blockchain_verified,
        p.rpa_optimized,
        p.media_url,
        p.visibility,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_id_param) as is_liked,
        EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = user_id_param) as is_bookmarked
      FROM posts p
      JOIN profiles pr ON p.author_id = pr.id
      WHERE p.author_id IN (
        SELECT following_id FROM follows WHERE follower_id = user_id_param
      )
      ORDER BY p.created_at DESC
      LIMIT limit_param OFFSET offset_param;
      
    WHEN 'trending' THEN
      RETURN QUERY
      SELECT 
        p.id,
        p.content,
        p.author_id,
        pr.name as author_name,
        pr.avatar_url as author_avatar,
        pr.verified as author_verified,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        p.hashtags,
        p.ai_score,
        p.blockchain_verified,
        p.rpa_optimized,
        p.media_url,
        p.visibility,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_id_param) as is_liked,
        EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = user_id_param) as is_bookmarked
      FROM posts p
      JOIN profiles pr ON p.author_id = pr.id
      WHERE p.created_at >= NOW() - INTERVAL '24 hours'
        AND p.likes_count >= 5
      ORDER BY p.likes_count DESC, p.created_at DESC
      LIMIT limit_param OFFSET offset_param;
      
    WHEN 'latest' THEN
      RETURN QUERY
      SELECT 
        p.id,
        p.content,
        p.author_id,
        pr.name as author_name,
        pr.avatar_url as author_avatar,
        pr.verified as author_verified,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        p.hashtags,
        p.ai_score,
        p.blockchain_verified,
        p.rpa_optimized,
        p.media_url,
        p.visibility,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_id_param) as is_liked,
        EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = user_id_param) as is_bookmarked
      FROM posts p
      JOIN profiles pr ON p.author_id = pr.id
      ORDER BY p.created_at DESC
      LIMIT limit_param OFFSET offset_param;
      
    ELSE -- 'for-you' default
      RETURN QUERY
      SELECT 
        p.id,
        p.content,
        p.author_id,
        pr.name as author_name,
        pr.avatar_url as author_avatar,
        pr.verified as author_verified,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        p.hashtags,
        p.ai_score,
        p.blockchain_verified,
        p.rpa_optimized,
        p.media_url,
        p.visibility,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_id_param) as is_liked,
        EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = user_id_param) as is_bookmarked
      FROM posts p
      JOIN profiles pr ON p.author_id = pr.id
      ORDER BY p.ai_score DESC, p.created_at DESC
      LIMIT limit_param OFFSET offset_param;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(
  hours_back INTEGER DEFAULT 24,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  hashtag TEXT,
  post_count BIGINT,
  growth_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH hashtag_stats AS (
    SELECT 
      unnest(hashtags) as tag,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '6 hours') as recent_count
    FROM posts 
    WHERE created_at >= NOW() - (hours_back || ' hours')::INTERVAL
      AND hashtags IS NOT NULL 
      AND array_length(hashtags, 1) > 0
    GROUP BY unnest(hashtags)
    HAVING COUNT(*) >= 2
  )
  SELECT 
    hs.tag as hashtag,
    hs.total_count as post_count,
    CASE 
      WHEN hs.total_count > 0 THEN ROUND((hs.recent_count::DECIMAL / hs.total_count::DECIMAL) * 100, 1)
      ELSE 0
    END as growth_rate
  FROM hashtag_stats hs
  ORDER BY growth_rate DESC, total_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feed statistics
CREATE OR REPLACE FUNCTION get_feed_statistics()
RETURNS TABLE (
  total_posts BIGINT,
  active_users BIGINT,
  trending_posts BIGINT,
  ai_enhanced BIGINT,
  blockchain_verified BIGINT,
  rpa_optimized BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(DISTINCT author_id) FROM posts WHERE created_at >= NOW() - INTERVAL '24 hours') as active_users,
    (SELECT COUNT(*) FROM posts WHERE created_at >= NOW() - INTERVAL '24 hours' AND likes_count >= 5) as trending_posts,
    (SELECT COUNT(*) FROM posts WHERE ai_score >= 0.7) as ai_enhanced,
    (SELECT COUNT(*) FROM posts WHERE blockchain_verified = true) as blockchain_verified,
    (SELECT COUNT(*) FROM posts WHERE rpa_optimized = true) as rpa_optimized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get suggested profiles for a user
CREATE OR REPLACE FUNCTION get_suggested_profiles(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar_url TEXT,
  verified BOOLEAN,
  followers_count INTEGER,
  mutual_connections BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_following AS (
    SELECT following_id FROM follows WHERE follower_id = user_id_param
  ),
  suggested_users AS (
    SELECT 
      p.id,
      p.name,
      p.avatar_url,
      p.verified,
      p.followers_count
    FROM profiles p
    WHERE p.id != user_id_param
      AND p.is_active = true
      AND p.id NOT IN (SELECT following_id FROM user_following)
    ORDER BY p.followers_count DESC
    LIMIT limit_param * 2
  )
  SELECT 
    su.id,
    su.name,
    su.avatar_url,
    su.verified,
    su.followers_count,
    (
      SELECT COUNT(*)
      FROM follows f1
      JOIN user_following uf ON f1.following_id = uf.following_id
      WHERE f1.follower_id = su.id
    ) as mutual_connections
  FROM suggested_users su
  ORDER BY mutual_connections DESC, su.followers_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle post interactions (like, bookmark, share)
CREATE OR REPLACE FUNCTION handle_post_interaction(
  user_id_param UUID,
  post_id_param UUID,
  interaction_type TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  new_state BOOLEAN,
  count INTEGER
) AS $$
DECLARE
  current_state BOOLEAN := false;
  new_count INTEGER := 0;
BEGIN
  CASE interaction_type
    WHEN 'like' THEN
      -- Check if already liked
      SELECT EXISTS(SELECT 1 FROM post_likes WHERE user_id = user_id_param AND post_id = post_id_param) INTO current_state;
      
      IF current_state THEN
        -- Unlike
        DELETE FROM post_likes WHERE user_id = user_id_param AND post_id = post_id_param;
        UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id_param;
        current_state := false;
      ELSE
        -- Like
        INSERT INTO post_likes (user_id, post_id, created_at) VALUES (user_id_param, post_id_param, NOW());
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id_param;
        current_state := true;
      END IF;
      
      SELECT likes_count INTO new_count FROM posts WHERE id = post_id_param;
      
    WHEN 'bookmark' THEN
      -- Check if already bookmarked
      SELECT EXISTS(SELECT 1 FROM post_bookmarks WHERE user_id = user_id_param AND post_id = post_id_param) INTO current_state;
      
      IF current_state THEN
        -- Remove bookmark
        DELETE FROM post_bookmarks WHERE user_id = user_id_param AND post_id = post_id_param;
        current_state := false;
      ELSE
        -- Add bookmark
        INSERT INTO post_bookmarks (user_id, post_id, created_at) VALUES (user_id_param, post_id_param, NOW());
        current_state := true;
      END IF;
      
    WHEN 'share' THEN
      -- Increment share count
      UPDATE posts SET shares_count = shares_count + 1 WHERE id = post_id_param;
      SELECT shares_count INTO new_count FROM posts WHERE id = post_id_param;
      current_state := true;
      
  END CASE;
  
  RETURN QUERY SELECT true as success, current_state as new_state, new_count as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update post engagement scores
CREATE OR REPLACE FUNCTION update_post_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update AI score based on engagement
  UPDATE posts 
  SET ai_score = LEAST(1.0, ai_score + (
    (NEW.likes_count * 0.1) + 
    (NEW.comments_count * 0.15) + 
    (NEW.shares_count * 0.2)
  ) / 100.0)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post engagement updates
DROP TRIGGER IF EXISTS trigger_update_post_engagement ON posts;
CREATE TRIGGER trigger_update_post_engagement
  AFTER UPDATE OF likes_count, comments_count, shares_count ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_personalized_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_hashtags TO authenticated;
GRANT EXECUTE ON FUNCTION get_feed_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_suggested_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION handle_post_interaction TO authenticated;
