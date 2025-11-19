-- Enhanced campaigns table with AI, Blockchain, and RPA fields
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS ai_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS blockchain_hash TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rpa_optimized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trending_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS visibility_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,4) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_optimized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS optimization_count INTEGER DEFAULT 0;

-- Campaign analytics table
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0,
    engagement_score DECIMAL(3,2) DEFAULT 0.0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign tags for better categorization
CREATE TABLE IF NOT EXISTS campaign_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign updates for transparency
CREATE TABLE IF NOT EXISTS campaign_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign shares tracking
CREATE TABLE IF NOT EXISTS campaign_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'facebook', 'twitter', 'whatsapp', 'email', etc.
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign views tracking
CREATE TABLE IF NOT EXISTS campaign_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI insights for campaigns
CREATE TABLE IF NOT EXISTS campaign_ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'optimization', 'prediction', 'recommendation'
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain verification records for campaigns
CREATE TABLE IF NOT EXISTS campaign_blockchain_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    gas_used BIGINT,
    transaction_fee DECIMAL(18,8),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPA automation jobs for campaigns
CREATE TABLE IF NOT EXISTS campaign_rpa_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- 'content_optimization', 'social_sharing', 'donor_outreach'
    job_status TEXT DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed'
    job_data JSONB,
    result JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced donations table with more tracking
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS donation_source TEXT DEFAULT 'direct', -- 'direct', 'social_share', 'email_campaign'
ADD COLUMN IF NOT EXISTS referrer_url TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_ai_score ON campaigns(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_trending_score ON campaigns(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_blockchain_verified ON campaigns(blockchain_verified);
CREATE INDEX IF NOT EXISTS idx_campaigns_rpa_optimized ON campaigns(rpa_optimized);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_campaign_tags_campaign_id ON campaign_tags(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_tags_tag_name ON campaign_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id ON campaign_updates(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_shares_campaign_id ON campaign_shares(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_shares_platform ON campaign_shares(platform);
CREATE INDEX IF NOT EXISTS idx_campaign_views_campaign_id ON campaign_views(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_views_viewed_at ON campaign_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_ai_insights_campaign_id ON campaign_ai_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_blockchain_records_campaign_id ON campaign_blockchain_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_rpa_jobs_campaign_id ON campaign_rpa_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_rpa_jobs_status ON campaign_rpa_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_donations_source ON donations(donation_source);
CREATE INDEX IF NOT EXISTS idx_donations_blockchain_verified ON donations(blockchain_verified);

-- RLS Policies
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_rpa_jobs ENABLE ROW LEVEL SECURITY;

-- Campaign analytics policies
CREATE POLICY "Campaign analytics are viewable by campaign owners" ON campaign_analytics
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage campaign analytics" ON campaign_analytics
    FOR ALL WITH CHECK (true);

-- Campaign tags policies
CREATE POLICY "Campaign tags are publicly viewable" ON campaign_tags
    FOR SELECT USING (true);

CREATE POLICY "Campaign owners can manage tags" ON campaign_tags
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

-- Campaign updates policies
CREATE POLICY "Campaign updates are publicly viewable" ON campaign_updates
    FOR SELECT USING (true);

CREATE POLICY "Campaign owners can manage updates" ON campaign_updates
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

-- Campaign shares policies
CREATE POLICY "Users can view their own shares" ON campaign_shares
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares" ON campaign_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campaign views policies (read-only for users)
CREATE POLICY "Campaign views are system managed" ON campaign_views
    FOR ALL WITH CHECK (true);

-- AI insights policies
CREATE POLICY "Campaign AI insights are viewable by owners" ON campaign_ai_insights
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage AI insights" ON campaign_ai_insights
    FOR ALL WITH CHECK (true);

-- Blockchain records policies
CREATE POLICY "Blockchain records are viewable by campaign owners" ON campaign_blockchain_records
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage blockchain records" ON campaign_blockchain_records
    FOR ALL WITH CHECK (true);

-- RPA jobs policies
CREATE POLICY "RPA jobs are viewable by campaign owners" ON campaign_rpa_jobs
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage RPA jobs" ON campaign_rpa_jobs
    FOR ALL WITH CHECK (true);

-- Functions for campaign analytics
CREATE OR REPLACE FUNCTION update_campaign_trending_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update trending score based on recent activity
    UPDATE campaigns 
    SET trending_score = LEAST(1.0, (
        -- Base score from recent donations
        (SELECT COALESCE(COUNT(*), 0) * 0.1 
         FROM donations 
         WHERE campaign_id = NEW.campaign_id 
         AND created_at > NOW() - INTERVAL '7 days') +
        
        -- Score from recent views
        (SELECT COALESCE(COUNT(*), 0) * 0.01 
         FROM campaign_views 
         WHERE campaign_id = NEW.campaign_id 
         AND viewed_at > NOW() - INTERVAL '24 hours') +
        
        -- Score from recent shares
        (SELECT COALESCE(COUNT(*), 0) * 0.05 
         FROM campaign_shares 
         WHERE campaign_id = NEW.campaign_id 
         AND shared_at > NOW() - INTERVAL '7 days')
    ))
    WHERE id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for trending score updates
CREATE TRIGGER update_trending_on_donation
    AFTER INSERT ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_trending_score();

CREATE TRIGGER update_trending_on_view
    AFTER INSERT ON campaign_views
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_trending_score();

CREATE TRIGGER update_trending_on_share
    AFTER INSERT ON campaign_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_trending_score();

-- Function to get campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_uuid UUID)
RETURNS TABLE (
    total_views BIGINT,
    total_shares BIGINT,
    total_donations BIGINT,
    avg_donation DECIMAL,
    conversion_rate DECIMAL,
    engagement_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM campaign_views WHERE campaign_id = campaign_uuid) as total_views,
        (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = campaign_uuid) as total_shares,
        (SELECT COUNT(*) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured') as total_donations,
        (SELECT COALESCE(AVG(amount), 0) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured') as avg_donation,
        (SELECT CASE 
            WHEN (SELECT COUNT(*) FROM campaign_views WHERE campaign_id = campaign_uuid) > 0 
            THEN (SELECT COUNT(*) FROM donations WHERE campaign_id = campaign_uuid AND status = 'captured')::DECIMAL / 
                 (SELECT COUNT(*) FROM campaign_views WHERE campaign_id = campaign_uuid)::DECIMAL
            ELSE 0 
        END) as conversion_rate,
        (SELECT COALESCE(trending_score, 0) FROM campaigns WHERE id = campaign_uuid) as engagement_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_campaign_trending_score() TO authenticated;
