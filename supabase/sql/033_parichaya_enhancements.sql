-- Enhanced profile features for Parichaya page

-- Add profile verification and reputation system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'pending', 'unverified'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;

-- Create profile insights table for AI/RPA analysis
CREATE TABLE IF NOT EXISTS profile_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile achievements table
CREATE TABLE IF NOT EXISTS profile_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_data JSONB NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile visits tracking table
CREATE TABLE IF NOT EXISTS profile_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    visit_duration INTEGER, -- in seconds
    pages_viewed TEXT[],
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social graph analysis table
CREATE TABLE IF NOT EXISTS social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL, -- 'mutual_follow', 'common_interest', 'interaction_based'
    connection_strength DECIMAL(3,2) DEFAULT 0.0,
    connection_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blockchain verification records table
CREATE TABLE IF NOT EXISTS blockchain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'profile', 'post', 'campaign', etc.
    entity_id UUID NOT NULL,
    verification_hash TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    block_number BIGINT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_insights_user_id ON profile_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_insights_type ON profile_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_profile_insights_generated_at ON profile_insights(generated_at);

CREATE INDEX IF NOT EXISTS idx_profile_achievements_user_id ON profile_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_type ON profile_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_earned_at ON profile_achievements(earned_at);

CREATE INDEX IF NOT EXISTS idx_profile_visits_profile_id ON profile_visits(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_visits_visitor_id ON profile_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_profile_visits_created_at ON profile_visits(created_at);

CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_type ON social_connections(connection_type);

CREATE INDEX IF NOT EXISTS idx_blockchain_verifications_entity ON blockchain_verifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_verifications_status ON blockchain_verifications(verification_status);

-- Add RLS policies
ALTER TABLE profile_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_verifications ENABLE ROW LEVEL SECURITY;

-- Profile insights policies
CREATE POLICY "Users can view their own insights" ON profile_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" ON profile_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all insights" ON profile_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Profile achievements policies
CREATE POLICY "Users can view their own achievements" ON profile_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view visible achievements" ON profile_achievements
    FOR SELECT USING (is_visible = true);

CREATE POLICY "System can insert achievements" ON profile_achievements
    FOR INSERT WITH CHECK (true); -- System-generated

-- Profile visits policies
CREATE POLICY "Users can view visits to their profile" ON profile_visits
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can log profile visits" ON profile_visits
    FOR INSERT WITH CHECK (true);

-- Social connections policies
CREATE POLICY "Users can view their own connections" ON social_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage connections" ON social_connections
    FOR ALL USING (true); -- System-managed

-- Blockchain verifications policies
CREATE POLICY "Public can view verified records" ON blockchain_verifications
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "System can manage verifications" ON blockchain_verifications
    FOR ALL USING (true); -- System-managed

-- Functions for profile analytics

-- Function to update profile view count
CREATE OR REPLACE FUNCTION increment_profile_views(profile_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET profile_views_count = profile_views_count + 1,
        last_active_at = NOW()
    WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(profile_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_posts INTEGER;
    total_likes INTEGER;
    total_comments INTEGER;
    followers_count INTEGER;
    engagement_rate DECIMAL;
BEGIN
    -- Get post counts
    SELECT COUNT(*) INTO total_posts
    FROM posts 
    WHERE user_id = profile_uuid AND is_hidden = false;
    
    -- Get total likes
    SELECT COALESCE(SUM(likes_count), 0) INTO total_likes
    FROM posts 
    WHERE user_id = profile_uuid AND is_hidden = false;
    
    -- Get total comments
    SELECT COALESCE(SUM(comments_count), 0) INTO total_comments
    FROM posts 
    WHERE user_id = profile_uuid AND is_hidden = false;
    
    -- Get followers count
    SELECT COUNT(*) INTO followers_count
    FROM follows 
    WHERE followee_id = profile_uuid;
    
    -- Calculate engagement rate
    IF followers_count > 0 AND total_posts > 0 THEN
        engagement_rate := ((total_likes + total_comments) * 100.0) / (followers_count * total_posts);
    ELSE
        engagement_rate := 0.0;
    END IF;
    
    RETURN LEAST(engagement_rate, 100.0); -- Cap at 100%
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update reputation score
CREATE OR REPLACE FUNCTION update_reputation_score(profile_uuid UUID)
RETURNS void AS $$
DECLARE
    base_score DECIMAL := 0.0;
    engagement_bonus DECIMAL := 0.0;
    verification_bonus DECIMAL := 0.0;
    activity_bonus DECIMAL := 0.0;
    final_score DECIMAL;
BEGIN
    -- Base score from followers (max 30 points)
    SELECT LEAST(COUNT(*) * 0.1, 30.0) INTO base_score
    FROM follows 
    WHERE followee_id = profile_uuid;
    
    -- Engagement bonus (max 40 points)
    SELECT calculate_engagement_rate(profile_uuid) * 0.4 INTO engagement_bonus;
    
    -- Verification bonus (20 points if verified)
    SELECT CASE 
        WHEN verification_status = 'verified' THEN 20.0 
        ELSE 0.0 
    END INTO verification_bonus
    FROM profiles 
    WHERE id = profile_uuid;
    
    -- Activity bonus based on recent posts (max 10 points)
    SELECT LEAST(COUNT(*) * 2.0, 10.0) INTO activity_bonus
    FROM posts 
    WHERE user_id = profile_uuid 
    AND created_at > NOW() - INTERVAL '30 days'
    AND is_hidden = false;
    
    final_score := LEAST(base_score + engagement_bonus + verification_bonus + activity_bonus, 100.0);
    
    UPDATE profiles 
    SET reputation_score = final_score
    WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate profile insights
CREATE OR REPLACE FUNCTION generate_profile_insights(profile_uuid UUID)
RETURNS void AS $$
DECLARE
    insight_data JSONB;
BEGIN
    -- Generate basic insights
    SELECT jsonb_build_object(
        'total_posts', (SELECT COUNT(*) FROM posts WHERE user_id = profile_uuid AND is_hidden = false),
        'total_likes', (SELECT COALESCE(SUM(likes_count), 0) FROM posts WHERE user_id = profile_uuid AND is_hidden = false),
        'total_comments', (SELECT COALESCE(SUM(comments_count), 0) FROM posts WHERE user_id = profile_uuid AND is_hidden = false),
        'followers_count', (SELECT COUNT(*) FROM follows WHERE followee_id = profile_uuid),
        'following_count', (SELECT COUNT(*) FROM follows WHERE follower_id = profile_uuid),
        'engagement_rate', calculate_engagement_rate(profile_uuid),
        'last_post_date', (SELECT MAX(created_at) FROM posts WHERE user_id = profile_uuid AND is_hidden = false),
        'account_age_days', (SELECT EXTRACT(DAY FROM NOW() - created_at) FROM profiles WHERE id = profile_uuid),
        'generated_at', NOW()
    ) INTO insight_data;
    
    -- Insert or update insights
    INSERT INTO profile_insights (user_id, insight_type, insight_data, expires_at)
    VALUES (profile_uuid, 'basic_stats', insight_data, NOW() + INTERVAL '24 hours')
    ON CONFLICT (user_id, insight_type) 
    DO UPDATE SET 
        insight_data = EXCLUDED.insight_data,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update reputation score when relevant data changes
CREATE OR REPLACE FUNCTION trigger_reputation_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reputation for the affected user
    IF TG_TABLE_NAME = 'follows' THEN
        PERFORM update_reputation_score(NEW.followee_id);
        IF TG_OP = 'DELETE' THEN
            PERFORM update_reputation_score(OLD.followee_id);
        END IF;
    ELSIF TG_TABLE_NAME = 'posts' THEN
        PERFORM update_reputation_score(NEW.user_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS reputation_update_on_follow ON follows;
CREATE TRIGGER reputation_update_on_follow
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION trigger_reputation_update();

DROP TRIGGER IF EXISTS reputation_update_on_post ON posts;
CREATE TRIGGER reputation_update_on_post
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION trigger_reputation_update();

-- Create view for profile analytics
CREATE OR REPLACE VIEW profile_analytics AS
SELECT 
    p.id,
    p.full_name,
    p.verification_status,
    p.reputation_score,
    p.profile_views_count,
    p.blockchain_verified,
    p.created_at as profile_created_at,
    p.last_active_at,
    
    -- Follower stats
    COALESCE(f.followers_count, 0) as followers_count,
    COALESCE(fg.following_count, 0) as following_count,
    
    -- Content stats
    COALESCE(pc.posts_count, 0) as posts_count,
    COALESCE(rc.reels_count, 0) as reels_count,
    COALESCE(cc.campaigns_count, 0) as campaigns_count,
    
    -- Engagement stats
    COALESCE(ps.total_likes, 0) as total_likes,
    COALESCE(ps.total_comments, 0) as total_comments,
    calculate_engagement_rate(p.id) as engagement_rate,
    
    -- Recent activity
    COALESCE(ra.recent_posts, 0) as recent_posts_30d,
    COALESCE(rv.recent_visits, 0) as recent_visits_7d
    
FROM profiles p

LEFT JOIN (
    SELECT followee_id, COUNT(*) as followers_count
    FROM follows
    GROUP BY followee_id
) f ON p.id = f.followee_id

LEFT JOIN (
    SELECT follower_id, COUNT(*) as following_count
    FROM follows
    GROUP BY follower_id
) fg ON p.id = fg.follower_id

LEFT JOIN (
    SELECT user_id, COUNT(*) as posts_count
    FROM posts
    WHERE is_hidden = false
    GROUP BY user_id
) pc ON p.id = pc.user_id

LEFT JOIN (
    SELECT author_id, COUNT(*) as reels_count
    FROM reels
    WHERE is_hidden = false
    GROUP BY author_id
) rc ON p.id = rc.author_id

LEFT JOIN (
    SELECT owner_id, COUNT(*) as campaigns_count
    FROM campaigns
    GROUP BY owner_id
) cc ON p.id = cc.owner_id

LEFT JOIN (
    SELECT user_id, 
           SUM(likes_count) as total_likes,
           SUM(comments_count) as total_comments
    FROM posts
    WHERE is_hidden = false
    GROUP BY user_id
) ps ON p.id = ps.user_id

LEFT JOIN (
    SELECT user_id, COUNT(*) as recent_posts
    FROM posts
    WHERE created_at > NOW() - INTERVAL '30 days'
    AND is_hidden = false
    GROUP BY user_id
) ra ON p.id = ra.user_id

LEFT JOIN (
    SELECT profile_id, COUNT(*) as recent_visits
    FROM profile_visits
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY profile_id
) rv ON p.id = rv.profile_id;

-- Grant permissions
GRANT SELECT ON profile_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION increment_profile_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_engagement_rate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_reputation_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_profile_insights(UUID) TO authenticated;
