-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    interests TEXT[] DEFAULT '{}',
    usage_pattern TEXT DEFAULT 'casual',
    budget_range TEXT DEFAULT 'moderate',
    features_priority TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL,
    recommended_plan TEXT,
    confidence DECIMAL(3,2),
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain verifications table
CREATE TABLE IF NOT EXISTS blockchain_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_hash TEXT NOT NULL,
    transaction_id TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain transactions table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPA tasks table
CREATE TABLE IF NOT EXISTS rpa_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    plan_id TEXT,
    status TEXT DEFAULT 'scheduled',
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPA analyses table
CREATE TABLE IF NOT EXISTS rpa_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    plan_id TEXT,
    insights TEXT,
    automation_tasks TEXT[],
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity tracking for better recommendations
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Subscriptions table (if not exists)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    amount INTEGER NOT NULL,
    blockchain_verified BOOLEAN DEFAULT FALSE,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add preferences column to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_verifications_user_id ON blockchain_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_type ON blockchain_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_rpa_analyses_user_id ON rpa_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- AI recommendations policies
CREATE POLICY "Users can view their own AI recommendations" ON ai_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert AI recommendations" ON ai_recommendations
    FOR INSERT WITH CHECK (true);

-- Blockchain verifications policies
CREATE POLICY "Users can view their own blockchain verifications" ON blockchain_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert blockchain verifications" ON blockchain_verifications
    FOR INSERT WITH CHECK (true);

-- Blockchain transactions policies
CREATE POLICY "Users can view their own blockchain transactions" ON blockchain_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert blockchain transactions" ON blockchain_transactions
    FOR INSERT WITH CHECK (true);

-- RPA tasks policies
CREATE POLICY "Users can view own tasks" ON rpa_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage tasks" ON rpa_tasks
    FOR ALL WITH CHECK (true);

-- RPA analyses policies
CREATE POLICY "Users can view their own RPA analyses" ON rpa_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert RPA analyses" ON rpa_analyses
    FOR INSERT WITH CHECK (true);

-- User activity policies
CREATE POLICY "Users can view own activity" ON user_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity" ON user_activity
    FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update subscriptions" ON subscriptions
    FOR UPDATE USING (true);

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_subscription_analytics()
RETURNS TABLE (
    total_users BIGINT,
    active_subscriptions BIGINT,
    popular_plan TEXT,
    avg_satisfaction DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::BIGINT as active_subscriptions,
        (SELECT plan_id FROM subscriptions WHERE status = 'active' GROUP BY plan_id ORDER BY COUNT(*) DESC LIMIT 1) as popular_plan,
        0.94::DECIMAL as avg_satisfaction; -- Mock satisfaction rate
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_analytics() TO authenticated;
