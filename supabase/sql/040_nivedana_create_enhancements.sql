-- Enhanced campaign creation tracking
CREATE TABLE IF NOT EXISTS campaign_creation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL,
    current_step INTEGER DEFAULT 1,
    ai_optimized BOOLEAN DEFAULT FALSE,
    blockchain_verified BOOLEAN DEFAULT FALSE,
    rpa_enabled BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI content optimization history
CREATE TABLE IF NOT EXISTS ai_content_optimizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_title TEXT NOT NULL,
    optimized_title TEXT,
    original_description TEXT NOT NULL,
    optimized_description TEXT,
    suggested_tags TEXT[],
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    improvements TEXT[],
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign file uploads tracking
CREATE TABLE IF NOT EXISTS campaign_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL, -- 'cover_image', 'document', 'media'
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    upload_status TEXT DEFAULT 'completed', -- 'uploading', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign creation analytics
CREATE TABLE IF NOT EXISTS campaign_creation_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    step_completed INTEGER NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    ai_features_used TEXT[],
    blockchain_features_used TEXT[],
    rpa_features_used TEXT[],
    completion_rate DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium feature usage tracking
CREATE TABLE IF NOT EXISTS premium_feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- 'ai_optimization', 'blockchain_verification', 'rpa_automation'
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign templates for quick creation
CREATE TABLE IF NOT EXISTS campaign_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    template_data JSONB NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_creation_sessions_user_id ON campaign_creation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creation_sessions_completed ON campaign_creation_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_ai_content_optimizations_user_id ON ai_content_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_optimizations_applied ON ai_content_optimizations(applied);
CREATE INDEX IF NOT EXISTS idx_campaign_uploads_user_id ON campaign_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_uploads_campaign_id ON campaign_uploads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_uploads_file_type ON campaign_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_campaign_creation_analytics_user_id ON campaign_creation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_feature_usage_user_id ON premium_feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_feature_usage_feature_type ON premium_feature_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_category ON campaign_templates(category);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_premium ON campaign_templates(is_premium);

-- RLS Policies
ALTER TABLE campaign_creation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- Campaign creation sessions policies
CREATE POLICY "Users can manage their own creation sessions" ON campaign_creation_sessions
    FOR ALL USING (auth.uid() = user_id);

-- AI content optimizations policies
CREATE POLICY "Users can manage their own AI optimizations" ON ai_content_optimizations
    FOR ALL USING (auth.uid() = user_id);

-- Campaign uploads policies
CREATE POLICY "Users can manage their own uploads" ON campaign_uploads
    FOR ALL USING (auth.uid() = user_id);

-- Campaign creation analytics policies
CREATE POLICY "Users can view their own analytics" ON campaign_creation_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage creation analytics" ON campaign_creation_analytics
    FOR INSERT WITH CHECK (true);

-- Premium feature usage policies
CREATE POLICY "Users can view their own feature usage" ON premium_feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feature usage" ON premium_feature_usage
    FOR ALL WITH CHECK (true);

-- Campaign templates policies
CREATE POLICY "Templates are publicly viewable" ON campaign_templates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates" ON campaign_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Functions for campaign creation
CREATE OR REPLACE FUNCTION save_campaign_creation_progress(
    p_session_data JSONB,
    p_current_step INTEGER,
    p_ai_optimized BOOLEAN DEFAULT FALSE,
    p_blockchain_verified BOOLEAN DEFAULT FALSE,
    p_rpa_enabled BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Insert or update campaign creation session
    INSERT INTO campaign_creation_sessions (
        user_id,
        session_data,
        current_step,
        ai_optimized,
        blockchain_verified,
        rpa_enabled,
        updated_at
    )
    VALUES (
        auth.uid(),
        p_session_data,
        p_current_step,
        p_ai_optimized,
        p_blockchain_verified,
        p_rpa_enabled,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        session_data = EXCLUDED.session_data,
        current_step = EXCLUDED.current_step,
        ai_optimized = EXCLUDED.ai_optimized,
        blockchain_verified = EXCLUDED.blockchain_verified,
        rpa_enabled = EXCLUDED.rpa_enabled,
        updated_at = NOW()
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track premium feature usage
CREATE OR REPLACE FUNCTION track_premium_feature_usage(
    p_feature_type TEXT,
    p_feature_name TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO premium_feature_usage (
        user_id,
        feature_type,
        feature_name,
        usage_count,
        last_used_at
    )
    VALUES (
        auth.uid(),
        p_feature_type,
        p_feature_name,
        1,
        NOW()
    )
    ON CONFLICT (user_id, feature_type, feature_name)
    DO UPDATE SET
        usage_count = premium_feature_usage.usage_count + 1,
        last_used_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign creation progress
CREATE OR REPLACE FUNCTION get_campaign_creation_progress(p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    session_data JSONB,
    current_step INTEGER,
    ai_optimized BOOLEAN,
    blockchain_verified BOOLEAN,
    rpa_enabled BOOLEAN,
    completion_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ccs.id,
        ccs.session_data,
        ccs.current_step,
        ccs.ai_optimized,
        ccs.blockchain_verified,
        ccs.rpa_enabled,
        (ccs.current_step::DECIMAL / 5.0 * 100) as completion_percentage
    FROM campaign_creation_sessions ccs
    WHERE ccs.user_id = p_user_id
    AND ccs.completed = FALSE
    ORDER BY ccs.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default campaign templates
INSERT INTO campaign_templates (name, category, template_data, is_premium) VALUES
('Medical Emergency Template', 'Medical Emergency', '{
    "title": "Help [Patient Name] Fight [Medical Condition]",
    "description": "Our beloved [relationship] is facing a challenging battle with [medical condition]. The medical expenses are overwhelming, and we need your support to ensure they receive the best possible treatment.\n\nYour donation will help cover:\n- Medical treatments and procedures\n- Hospital expenses\n- Medication costs\n- Recovery and rehabilitation\n\nEvery contribution, no matter how small, brings us closer to giving [Patient Name] the fighting chance they deserve.",
    "suggestedGoal": 500000,
    "tags": ["medical", "emergency", "healthcare", "treatment", "help"]
}', true),

('Education Support Template', 'Education', '{
    "title": "Support [Student Name]''s Educational Journey",
    "description": "Education is the key to breaking the cycle of poverty and creating a brighter future. [Student Name] is a bright and determined student who dreams of [educational goal], but financial constraints are standing in the way.\n\nYour support will help with:\n- Tuition fees and educational expenses\n- Books and learning materials\n- Transportation and accommodation\n- Technology and equipment needed for studies\n\nHelp us invest in [Student Name]''s future and make their educational dreams a reality.",
    "suggestedGoal": 200000,
    "tags": ["education", "student", "learning", "scholarship", "future"]
}', true),

('Community Development Template', 'Community Development', '{
    "title": "Building a Better Community: [Project Name]",
    "description": "Our community has identified a critical need for [project description]. This initiative will directly benefit [number] families and create lasting positive change in our neighborhood.\n\nProject goals:\n- [Goal 1]\n- [Goal 2]\n- [Goal 3]\n\nYour contribution will help us:\n- Purchase necessary materials and equipment\n- Cover labor and professional services\n- Ensure project sustainability\n\nTogether, we can build a stronger, more vibrant community for everyone.",
    "suggestedGoal": 1000000,
    "tags": ["community", "development", "social", "improvement", "together"]
}', false),

('Animal Welfare Template', 'Animal Welfare', '{
    "title": "Rescue and Care for [Animal/Animals]",
    "description": "[Animal description] desperately needs our help. These innocent creatures have been [situation description] and require immediate medical attention and care.\n\nYour donation will provide:\n- Emergency medical treatment\n- Food and shelter\n- Rehabilitation and recovery care\n- Long-term care and adoption support\n\nEvery animal deserves love, care, and a chance at a happy life. Please help us give these animals the second chance they deserve.",
    "suggestedGoal": 150000,
    "tags": ["animals", "rescue", "welfare", "care", "compassion"]
}', false);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION save_campaign_creation_progress(JSONB, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION track_premium_feature_usage(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_creation_progress(UUID) TO authenticated;
