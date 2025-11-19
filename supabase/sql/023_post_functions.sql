-- Function to increment post likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement post likes count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment post comments count
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = comments_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement post comments count
CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = GREATEST(comments_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_post_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_comments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_comments(UUID) TO authenticated;
