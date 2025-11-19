-- Add missing columns to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS visibility_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,4) DEFAULT 0.0;

-- Create campaign_updates table if not exists
CREATE TABLE IF NOT EXISTS campaign_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add author_id column to campaign_updates if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_updates' AND column_name = 'author_id') THEN
        ALTER TABLE campaign_updates ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id ON campaign_updates(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_updates_author_id ON campaign_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON campaigns(location);
CREATE INDEX IF NOT EXISTS idx_campaigns_tags ON campaigns USING GIN(tags);

-- RLS policies for campaign_updates
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign updates are publicly viewable" ON campaign_updates
    FOR SELECT USING (true);

CREATE POLICY "Campaign owners can manage updates" ON campaign_updates
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

-- Function to update campaign engagement metrics
CREATE OR REPLACE FUNCTION update_campaign_engagement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update engagement rate based on recent activity
    UPDATE campaigns 
    SET engagement_rate = LEAST(1.0, (
        -- Base score from recent donations
        (SELECT COALESCE(COUNT(*), 0) * 0.1 
         FROM donations 
         WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
         AND created_at > NOW() - INTERVAL '7 days') +
        
        -- Score from recent views
        (SELECT COALESCE(COUNT(*), 0) * 0.01 
         FROM campaign_views 
         WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
         AND viewed_at > NOW() - INTERVAL '24 hours') +
        
        -- Score from recent shares
        (SELECT COALESCE(COUNT(*), 0) * 0.05 
         FROM campaign_shares 
         WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
         AND shared_at > NOW() - INTERVAL '7 days') +
        
        -- Score from recent updates
        (SELECT COALESCE(COUNT(*), 0) * 0.02 
         FROM campaign_updates 
         WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
         AND created_at > NOW() - INTERVAL '7 days')
    ))
    WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for engagement updates
DROP TRIGGER IF EXISTS update_engagement_on_update ON campaign_updates;
CREATE TRIGGER update_engagement_on_update
    AFTER INSERT OR UPDATE OR DELETE ON campaign_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_engagement();

-- Function to get comprehensive campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_detailed_stats(campaign_uuid UUID)
RETURNS TABLE (
    total_views BIGINT,
    total_shares BIGINT,
    total_donations BIGINT,
    total_updates BIGINT,
    avg_donation DECIMAL,
    conversion_rate DECIMAL,
    engagement_score DECIMAL,
    supporters_count BIGINT,
    recent_activity BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM campaign_views WHERE campaign_id = campaign_uuid) as total_views,
        (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = campaign_uuid) as total_shares,
        (SELECT COUNT(*) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured') as total_donations,
        (SELECT COUNT(*) FROM campaign_updates WHERE campaign_id = campaign_uuid) as total_updates,
        (SELECT COALESCE(AVG(amount), 0) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured') as avg_donation,
        (SELECT CASE 
            WHEN (SELECT COUNT(*) FROM campaign_views WHERE campaign_id = campaign_uuid) > 0 
            THEN (SELECT COUNT(*) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured')::DECIMAL / 
                 (SELECT COUNT(*) FROM campaign_views WHERE campaign_id = campaign_uuid)::DECIMAL
            ELSE 0 
        END) as conversion_rate,
        (SELECT COALESCE(engagement_rate, 0) FROM campaigns WHERE id = campaign_uuid) as engagement_score,
        (SELECT COUNT(DISTINCT user_id) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured') as supporters_count,
        (SELECT COUNT(*) FROM (
            SELECT created_at FROM donations WHERE campaign_id = campaign_uuid AND created_at > NOW() - INTERVAL '24 hours'
            UNION ALL
            SELECT viewed_at FROM campaign_views WHERE campaign_id = campaign_uuid AND viewed_at > NOW() - INTERVAL '24 hours'
            UNION ALL
            SELECT shared_at FROM campaign_shares WHERE campaign_id = campaign_uuid AND shared_at > NOW() - INTERVAL '24 hours'
            UNION ALL
            SELECT created_at FROM campaign_updates WHERE campaign_id = campaign_uuid AND created_at > NOW() - INTERVAL '24 hours'
        ) recent) as recent_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_campaign_detailed_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_campaign_engagement() TO authenticated;
