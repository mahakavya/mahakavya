-- User Management Enhancements
-- This migration adds additional tables and functions for comprehensive user management

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'enterprise'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_risk_score INTEGER DEFAULT 0 CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL DEFAULT 0 CHECK (engagement_rate >= 0 AND engagement_rate <= 100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_spent DECIMAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('behavior_anomaly', 'engagement_pattern', 'risk_assessment', 'recommendation')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    actions_suggested TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved'))
);

-- Create bulk actions table
CREATE TABLE IF NOT EXISTS bulk_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL CHECK (action_type IN ('suspend', 'activate', 'verify', 'delete', 'send_notification')),
    user_ids UUID[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    results JSONB,
    reason TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_risk_score ON profiles(ai_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation_score ON profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_engagement_rate ON profiles(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_blockchain_verified ON profiles(blockchain_verified);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

CREATE INDEX IF NOT EXISTS idx_bulk_actions_status ON bulk_actions(status);
CREATE INDEX IF NOT EXISTS idx_bulk_actions_action_type ON bulk_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_bulk_actions_created_at ON bulk_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_actions_created_by ON bulk_actions(created_by);

-- Add RLS policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_actions ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for AI insights
CREATE POLICY "Admin can manage AI insights" ON ai_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Admin-only access policies for bulk actions
CREATE POLICY "Admin can manage bulk actions" ON bulk_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update content count when posts are added/removed
    IF TG_TABLE_NAME = 'posts' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE profiles 
            SET content_count = content_count + 1 
            WHERE id = NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE profiles 
            SET content_count = GREATEST(0, content_count - 1) 
            WHERE id = OLD.user_id;
        END IF;
    END IF;
    
    -- Update violation count when violations are added
    IF TG_TABLE_NAME = 'user_violations' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE profiles 
            SET violation_count = violation_count + 1 
            WHERE id = NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE profiles 
            SET violation_count = GREATEST(0, violation_count - 1) 
            WHERE id = OLD.user_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic stat updates
DROP TRIGGER IF EXISTS trigger_update_user_content_stats ON posts;
CREATE TRIGGER trigger_update_user_content_stats
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Create function to calculate AI risk score
CREATE OR REPLACE FUNCTION calculate_ai_risk_score(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    violation_count INTEGER;
    account_age_days INTEGER;
    content_count INTEGER;
    engagement_rate DECIMAL;
BEGIN
    -- Get user data
    SELECT 
        p.violation_count,
        p.content_count,
        p.engagement_rate,
        EXTRACT(DAYS FROM NOW() - p.created_at)
    INTO violation_count, content_count, engagement_rate, account_age_days
    FROM profiles p
    WHERE p.id = user_id;
    
    -- Base risk from violations (0-40 points)
    risk_score := LEAST(40, violation_count * 10);
    
    -- Account age factor (newer accounts are riskier, 0-20 points)
    IF account_age_days < 7 THEN
        risk_score := risk_score + 20;
    ELSIF account_age_days < 30 THEN
        risk_score := risk_score + 10;
    ELSIF account_age_days < 90 THEN
        risk_score := risk_score + 5;
    END IF;
    
    -- Content spam factor (0-20 points)
    IF content_count > 100 AND account_age_days < 30 THEN
        risk_score := risk_score + 20;
    ELSIF content_count > 50 AND account_age_days < 7 THEN
        risk_score := risk_score + 15;
    END IF;
    
    -- Low engagement factor (0-20 points)
    IF engagement_rate < 5 AND content_count > 20 THEN
        risk_score := risk_score + 20;
    ELSIF engagement_rate < 10 AND content_count > 10 THEN
        risk_score := risk_score + 10;
    END IF;
    
    -- Cap at 100
    risk_score := LEAST(100, risk_score);
    
    -- Update the user's risk score
    UPDATE profiles SET ai_risk_score = risk_score WHERE id = user_id;
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_ai_risk_score(UUID) TO authenticated;

-- Insert sample data for testing
INSERT INTO ai_insights (user_id, insight_type, severity, title, description, confidence, actions_suggested) 
SELECT 
    id,
    'risk_assessment',
    CASE 
        WHEN ai_risk_score > 70 THEN 'high'
        WHEN ai_risk_score > 40 THEN 'medium'
        ELSE 'low'
    END,
    'AI Risk Assessment',
    'Automated risk assessment based on user behavior patterns and account characteristics.',
    0.85,
    ARRAY['Monitor user activity', 'Review content history']
FROM profiles 
WHERE ai_risk_score > 30
LIMIT 10
ON CONFLICT DO NOTHING;
