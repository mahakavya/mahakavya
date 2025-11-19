-- Enhanced schema for Drishya (Reels) with AI, Blockchain, and RPA features

-- Add AI enhancement columns to reels table
ALTER TABLE reels ADD COLUMN IF NOT EXISTS ai_enhancement_data JSONB;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS suggested_hashtags TEXT[];
ALTER TABLE reels ADD COLUMN IF NOT EXISTS ai_sentiment_score DECIMAL(3,2);
ALTER TABLE reels ADD COLUMN IF NOT EXISTS ai_toxicity_score DECIMAL(3,2);

-- Add blockchain verification columns
ALTER TABLE reels ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS blockchain_hash TEXT;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS blockchain_verified_at TIMESTAMP WITH TIME ZONE;

-- Add RPA processing columns
ALTER TABLE reels ADD COLUMN IF NOT EXISTS rpa_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS rpa_processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS rpa_job_ids TEXT[];
ALTER TABLE reels ADD COLUMN IF NOT EXISTS rpa_optimization_score DECIMAL(3,2);

-- Create AI insights table for reels
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'reel', 'user_feed', 'content_analysis'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'content_analysis', 'feed_optimization', 'engagement_prediction'
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RPA jobs table
CREATE TABLE IF NOT EXISTS rpa_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'reel', 'user', 'content_batch'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- 'reel_processing', 'engagement_optimization', 'moderation'
    job_data JSONB NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    results JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hashtag trends table
CREATE TABLE IF NOT EXISTS hashtag_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    trend_score DECIMAL(5,2) DEFAULT 0.0,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL, -- 'feed_algorithm', 'content_filter', 'notification'
    preference_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_type)
);

-- Create reel analytics table for detailed metrics
CREATE TABLE IF NOT EXISTS reel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'view', 'like', 'share', 'comment', 'completion'
    metric_value DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content moderation log
CREATE TABLE IF NOT EXISTS content_moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'reel', 'comment', 'caption'
    content_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    moderation_type TEXT NOT NULL, -- 'ai_auto', 'rpa_auto', 'manual'
    action_taken TEXT NOT NULL, -- 'approved', 'rejected', 'flagged', 'hidden'
    reason TEXT,
    confidence_score DECIMAL(3,2),
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reels_ai_processed ON reels(ai_processed_at) WHERE ai_processed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reels_blockchain_verified ON reels(blockchain_verified, blockchain_verified_at);
CREATE INDEX IF NOT EXISTS idx_reels_rpa_processed ON reels(rpa_processed, rpa_processed_at);

CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at);

CREATE INDEX IF NOT EXISTS idx_rpa_jobs_entity ON rpa_jobs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_user ON rpa_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_status ON rpa_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_type ON rpa_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_hashtag_trends_usage ON hashtag_trends(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_trends_score ON hashtag_trends(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_trends_tag ON hashtag_trends(tag);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON user_preferences(preference_type);

CREATE INDEX IF NOT EXISTS idx_reel_analytics_reel ON reel_analytics(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_analytics_type ON reel_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_reel_analytics_timestamp ON reel_analytics(timestamp);

CREATE INDEX IF NOT EXISTS idx_moderation_log_content ON content_moderation_log(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_user ON content_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_type ON content_moderation_log(moderation_type);

-- Add RLS policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_log ENABLE ROW LEVEL SECURITY;

-- AI insights policies
CREATE POLICY "Users can view their own AI insights" ON ai_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage AI insights" ON ai_insights
    FOR ALL USING (true); -- System-managed

-- RPA jobs policies
CREATE POLICY "Users can view their own RPA jobs" ON rpa_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage RPA jobs" ON rpa_jobs
    FOR ALL USING (true); -- System-managed

-- Hashtag trends policies (public read)
CREATE POLICY "Anyone can view hashtag trends" ON hashtag_trends
    FOR SELECT USING (true);

CREATE POLICY "System can manage hashtag trends" ON hashtag_trends
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update hashtag trends" ON hashtag_trends
    FOR UPDATE USING (true);

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Reel analytics policies
CREATE POLICY "Users can view analytics for their reels" ON reel_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reels 
            WHERE id = reel_analytics.reel_id 
            AND author_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics" ON reel_analytics
    FOR INSERT WITH CHECK (true);

-- Content moderation log policies
CREATE POLICY "Users can view moderation of their content" ON content_moderation_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all moderation logs" ON content_moderation_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "System can insert moderation logs" ON content_moderation_log
    FOR INSERT WITH CHECK (true);

-- Functions for enhanced reel functionality

-- Function to update hashtag trends
CREATE OR REPLACE FUNCTION update_hashtag_trends(hashtags TEXT[])
RETURNS void AS $$
DECLARE
    tag TEXT;
BEGIN
    FOREACH tag IN ARRAY hashtags
    LOOP
        INSERT INTO hashtag_trends (tag, usage_count, last_used)
        VALUES (LOWER(tag), 1, NOW())
        ON CONFLICT (tag) 
        DO UPDATE SET 
            usage_count = hashtag_trends.usage_count + 1,
            last_used = NOW(),
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate reel engagement score
CREATE OR REPLACE FUNCTION calculate_reel_engagement_score(reel_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    reel_data RECORD;
    engagement_score DECIMAL;
    age_hours DECIMAL;
    view_rate DECIMAL;
    like_rate DECIMAL;
BEGIN
    SELECT views, likes, created_at INTO reel_data
    FROM reels 
    WHERE id = reel_uuid;
    
    IF NOT FOUND THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate age in hours
    age_hours := EXTRACT(EPOCH FROM (NOW() - reel_data.created_at)) / 3600.0;
    age_hours := GREATEST(age_hours, 1.0); -- Minimum 1 hour
    
    -- Calculate rates
    view_rate := reel_data.views / age_hours;
    like_rate := CASE WHEN reel_data.views > 0 THEN reel_data.likes::DECIMAL / reel_data.views ELSE 0 END;
    
    -- Engagement score formula
    engagement_score := (view_rate * 0.6) + (like_rate * 100 * 0.4);
    
    RETURN LEAST(engagement_score, 100.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized reel recommendations
CREATE OR REPLACE FUNCTION get_personalized_reels(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    reel_id UUID,
    recommendation_score DECIMAL
) AS $$
DECLARE
    user_preferences JSONB;
BEGIN
    -- Get user preferences
    SELECT preference_data INTO user_preferences
    FROM user_preferences 
    WHERE user_id = user_uuid AND preference_type = 'feed_algorithm';
    
    -- Return reels with recommendation scores
    RETURN QUERY
    SELECT 
        r.id as reel_id,
        (
            -- Base engagement score
            calculate_reel_engagement_score(r.id) * 0.4 +
            -- Recency bonus (newer content gets higher score)
            (100 - EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 3600.0) * 0.2 +
            -- Author preference bonus
            CASE 
                WHEN user_preferences IS NOT NULL AND 
                     user_preferences->'preferredAuthors' ? r.author_id::TEXT 
                THEN 20.0 
                ELSE 0.0 
            END * 0.2 +
            -- Random factor for diversity
            (RANDOM() * 20) * 0.2
        ) as recommendation_score
    FROM reels r
    WHERE r.is_hidden = false
    AND r.author_id != user_uuid -- Don't recommend user's own reels
    ORDER BY recommendation_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log reel analytics
CREATE OR REPLACE FUNCTION log_reel_analytics(
    reel_uuid UUID,
    metric_type_param TEXT,
    metric_value_param DECIMAL,
    user_uuid UUID DEFAULT NULL,
    metadata_param JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO reel_analytics (reel_id, metric_type, metric_value, user_id, metadata)
    VALUES (reel_uuid, metric_type_param, metric_value_param, user_uuid, metadata_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to extract and update hashtags when reel is created/updated
CREATE OR REPLACE FUNCTION extract_reel_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtags TEXT[];
BEGIN
    IF NEW.caption IS NOT NULL THEN
        -- Extract hashtags from caption
        SELECT array_agg(SUBSTRING(match FROM 2)) INTO hashtags
        FROM regexp_split_to_table(NEW.caption, '\s+') AS match
        WHERE match ~ '^#\w+';
        
        IF hashtags IS NOT NULL AND array_length(hashtags, 1) > 0 THEN
            -- Update hashtag trends
            PERFORM update_hashtag_trends(hashtags);
            
            -- Store hashtags in reel record
            NEW.suggested_hashtags := hashtags;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for hashtag extraction
DROP TRIGGER IF EXISTS extract_hashtags_trigger ON reels;
CREATE TRIGGER extract_hashtags_trigger
    BEFORE INSERT OR UPDATE ON reels
    FOR EACH ROW EXECUTE FUNCTION extract_reel_hashtags();

-- Create view for reel analytics dashboard
CREATE OR REPLACE VIEW reel_performance_view AS
SELECT 
    r.id,
    r.author_id,
    r.caption,
    r.views,
    r.likes,
    r.created_at,
    r.ai_sentiment_score,
    r.blockchain_verified,
    r.rpa_processed,
    
    -- Engagement metrics
    calculate_reel_engagement_score(r.id) as engagement_score,
    CASE WHEN r.views > 0 THEN (r.likes::DECIMAL / r.views) * 100 ELSE 0 END as like_rate,
    
    -- AI insights
    ai.insight_data->'sentiment_score' as ai_sentiment,
    ai.insight_data->'toxicity_score' as ai_toxicity,
    ai.insight_data->'category' as ai_category,
    
    -- Blockchain status
    bv.verification_status as blockchain_status,
    bv.blockchain_tx_hash,
    
    -- RPA processing
    rj.status as rpa_status,
    rj.results as rpa_results
    
FROM reels r
LEFT JOIN ai_insights ai ON ai.entity_id = r.id AND ai.entity_type = 'reel'
LEFT JOIN blockchain_verifications bv ON bv.entity_id = r.id AND bv.entity_type = 'reel'
LEFT JOIN rpa_jobs rj ON rj.entity_id = r.id AND rj.entity_type = 'reel'
WHERE r.is_hidden = false;

-- Grant permissions
GRANT SELECT ON reel_performance_view TO authenticated;
GRANT EXECUTE ON FUNCTION update_hashtag_trends(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_reel_engagement_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personalized_reels(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_reel_analytics(UUID, TEXT, DECIMAL, UUID, JSONB) TO authenticated;
