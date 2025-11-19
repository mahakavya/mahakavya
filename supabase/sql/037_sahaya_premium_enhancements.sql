-- Enhanced Sahaya Premium Features Schema

-- Add premium fields to existing listeners table
ALTER TABLE listeners ADD COLUMN IF NOT EXISTS ai_enhanced BOOLEAN DEFAULT false;
ALTER TABLE listeners ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;
ALTER TABLE listeners ADD COLUMN IF NOT EXISTS premium_tier TEXT DEFAULT 'standard';

-- Add premium fields to existing sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ai_guided BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ai_insights JSONB;

-- Create blockchain transactions table for Sahaya
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Create RPA jobs table for automation tracking
CREATE TABLE IF NOT EXISTS rpa_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result JSONB
);

-- Create user preferences table for premium settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    rpa_automation_enabled BOOLEAN DEFAULT true,
    ai_insights_enabled BOOLEAN DEFAULT true,
    blockchain_verification_enabled BOOLEAN DEFAULT true,
    anonymous_mode_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI insights cache table
CREATE TABLE IF NOT EXISTS ai_insights_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    insights JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_service ON blockchain_transactions(user_id, service);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_user_service ON rpa_jobs(user_id, service);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_status ON rpa_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_user_service ON ai_insights_cache(user_id, service);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_expires ON ai_insights_cache(expires_at);

-- Add RLS policies
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;

-- Blockchain transactions policies
CREATE POLICY "Users can view own blockchain transactions" ON blockchain_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blockchain transactions" ON blockchain_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPA jobs policies
CREATE POLICY "Users can view own RPA jobs" ON rpa_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own RPA jobs" ON rpa_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RPA jobs" ON rpa_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- AI insights cache policies
CREATE POLICY "Users can view own AI insights" ON ai_insights_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI insights" ON ai_insights_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to clean up expired AI insights
CREATE OR REPLACE FUNCTION cleanup_expired_ai_insights()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_insights_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user's premium status
CREATE OR REPLACE FUNCTION get_user_premium_status(user_uuid UUID)
RETURNS TABLE (
    has_premium BOOLEAN,
    can_emotional BOOLEAN,
    ai_enhanced BOOLEAN,
    blockchain_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(fa.can_emotional, false) as has_premium,
        COALESCE(fa.can_emotional, false) as can_emotional,
        COALESCE(up.ai_insights_enabled, false) as ai_enhanced,
        COALESCE(up.blockchain_verification_enabled, false) as blockchain_verified
    FROM feature_access fa
    LEFT JOIN user_preferences up ON up.user_id = user_uuid
    WHERE fa.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create anonymous session
CREATE OR REPLACE FUNCTION create_anonymous_session(
    seeker_uuid UUID,
    listener_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO sessions (
        seeker_id,
        listener_id,
        status,
        is_anonymous,
        ai_guided,
        blockchain_verified,
        created_at
    ) VALUES (
        seeker_uuid,
        listener_uuid,
        'confirmed',
        true,
        true,
        true,
        NOW()
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log blockchain transaction
CREATE OR REPLACE FUNCTION log_blockchain_transaction(
    user_uuid UUID,
    service_name TEXT,
    tx_type TEXT,
    tx_hash TEXT
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO blockchain_transactions (
        user_id,
        service,
        transaction_type,
        transaction_hash,
        status,
        created_at
    ) VALUES (
        user_uuid,
        service_name,
        tx_type,
        tx_hash,
        'confirmed',
        NOW()
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create RPA job
CREATE OR REPLACE FUNCTION create_rpa_job(
    user_uuid UUID,
    service_name TEXT,
    job_type_name TEXT
)
RETURNS UUID AS $$
DECLARE
    job_id UUID;
BEGIN
    INSERT INTO rpa_jobs (
        user_id,
        service,
        job_type,
        status,
        created_at,
        started_at
    ) VALUES (
        user_uuid,
        service_name,
        job_type_name,
        'running',
        NOW(),
        NOW()
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update listeners to support premium features
UPDATE listeners SET 
    ai_enhanced = true,
    blockchain_verified = true,
    premium_tier = 'premium'
WHERE rating >= 4.5;

-- Insert default user preferences for existing users
INSERT INTO user_preferences (user_id, rpa_automation_enabled, ai_insights_enabled, blockchain_verification_enabled)
SELECT id, true, true, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences);

COMMIT;
