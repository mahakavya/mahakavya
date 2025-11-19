-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create feature access record with basic access
  INSERT INTO feature_access (user_id, can_feed)
  VALUES (NEW.id, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for post likes count
DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for post comments count
DROP TRIGGER IF EXISTS post_comments_count_trigger ON post_comments;
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update reel likes count
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reels SET likes = likes + 1 WHERE id = NEW.reel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reels SET likes = likes - 1 WHERE id = OLD.reel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for reel likes count
DROP TRIGGER IF EXISTS reel_likes_count_trigger ON reel_likes;
CREATE TRIGGER reel_likes_count_trigger
  AFTER INSERT OR DELETE ON reel_likes
  FOR EACH ROW EXECUTE FUNCTION update_reel_likes_count();

-- Function to update reel views count
CREATE OR REPLACE FUNCTION update_reel_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reels SET views = views + 1 WHERE id = NEW.reel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reel views count
DROP TRIGGER IF EXISTS reel_views_count_trigger ON reel_views;
CREATE TRIGGER reel_views_count_trigger
  AFTER INSERT ON reel_views
  FOR EACH ROW EXECUTE FUNCTION update_reel_views_count();

-- Function to update campaign raised amount
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'captured' THEN
    UPDATE campaigns SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'captured' AND NEW.status = 'captured' THEN
    UPDATE campaigns SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'captured' AND NEW.status != 'captured' THEN
    UPDATE campaigns SET raised_amount = raised_amount - OLD.amount WHERE id = OLD.campaign_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaign raised amount
DROP TRIGGER IF EXISTS campaign_raised_amount_trigger ON donations;
CREATE TRIGGER campaign_raised_amount_trigger
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_campaign_raised_amount();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to set referral code on profile creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referral code generation
DROP TRIGGER IF EXISTS set_referral_code_trigger ON profiles;
CREATE TRIGGER set_referral_code_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_referral_code();
