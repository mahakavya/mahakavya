-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Grant basic feature access
    INSERT INTO feature_access (user_id, feature_name, has_access)
    VALUES 
        (NEW.id, 'posts', true),
        (NEW.id, 'comments', true),
        (NEW.id, 'messaging', true);
    
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
CREATE TRIGGER post_comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for comment likes count
CREATE TRIGGER comment_likes_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Function to update campaign raised amount
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount + NEW.amount WHERE id = NEW.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount - OLD.amount WHERE id = OLD.campaign_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
        UPDATE campaigns SET raised_amount = raised_amount - OLD.amount WHERE id = OLD.campaign_id;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for campaign raised amount
CREATE TRIGGER campaign_raised_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_campaign_raised_amount();

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
CREATE TRIGGER reel_likes_count_trigger
    AFTER INSERT OR DELETE ON reel_likes
    FOR EACH ROW EXECUTE FUNCTION update_reel_likes_count();

-- Function to update reel views count
CREATE OR REPLACE FUNCTION update_reel_views_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reels SET views = views + 1 WHERE id = NEW.reel_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for reel views count
CREATE TRIGGER reel_views_count_trigger
    AFTER INSERT ON reel_views
    FOR EACH ROW EXECUTE FUNCTION update_reel_views_count();

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

-- Trigger to set referral code
CREATE TRIGGER set_referral_code_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_content TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (p_user_id, p_type, p_title, p_content, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(
    search_query TEXT,
    content_type TEXT DEFAULT 'all',
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    author_name TEXT,
    created_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    IF content_type = 'posts' OR content_type = 'all' THEN
        RETURN QUERY
        SELECT 
            p.id,
            'post'::TEXT as type,
            substring(p.content from 1 for 100) as title,
            p.content,
            pr.full_name as author_name,
            p.created_at,
            ts_rank(to_tsvector('english', p.content), plainto_tsquery('english', search_query)) as rank
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        WHERE to_tsvector('english', p.content) @@ plainto_tsquery('english', search_query)
        AND NOT p.is_hidden
        ORDER BY rank DESC
        LIMIT limit_count;
    END IF;
    
    IF content_type = 'campaigns' OR content_type = 'all' THEN
        RETURN QUERY
        SELECT 
            c.id,
            'campaign'::TEXT as type,
            c.title,
            c.description as content,
            pr.full_name as author_name,
            c.created_at,
            ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', search_query)) as rank
        FROM campaigns c
        JOIN profiles pr ON c.owner_id = pr.id
        WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', search_query)
        AND c.status = 'live'
        ORDER BY rank DESC
        LIMIT limit_count;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
