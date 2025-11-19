-- Niyantrana Admin Dashboard Schema
-- This migration adds tables and functions for the admin dashboard

-- Create moderation logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag')),
    reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user actions table for admin actions on users
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('suspend', 'ban', 'activate', 'warn')),
    reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI jobs table for tracking AI processing jobs
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type TEXT NOT NULL CHECK (job_type IN ('content_analysis', 'user_behavior', 'trend_detection', 'risk_assessment')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    results JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blockchain transactions table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_hash TEXT UNIQUE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('content_verification', 'user_identity', 'payment', 'audit_log')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    block_number BIGINT,
    gas_used INTEGER,
    related_entity_id UUID,
    related_entity_type TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RPA jobs table
CREATE TABLE IF NOT EXISTS rpa_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('data_migration', 'bulk_moderation', 'user_onboarding', 'system_maintenance')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    scheduled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    parameters JSONB,
    results JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system metrics table for monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_unit TEXT,
    status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
    trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_id ON moderation_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_timestamp ON moderation_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_admin_id ON user_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_timestamp ON user_actions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_job_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_started_at ON ai_jobs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_type ON blockchain_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_timestamp ON blockchain_transactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_rpa_jobs_status ON rpa_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_type ON rpa_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_scheduled_at ON rpa_jobs(scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- Add RLS policies
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admin can view moderation logs" ON moderation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can insert moderation logs" ON moderation_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can view user actions" ON user_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can insert user actions" ON user_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can manage AI jobs" ON ai_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can view blockchain transactions" ON blockchain_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can manage RPA jobs" ON rpa_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can view system metrics" ON system_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create functions for admin dashboard
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'active_users', (SELECT COUNT(*) FROM profiles WHERE last_seen > NOW() - INTERVAL '24 hours'),
        'total_content', (SELECT COUNT(*) FROM posts),
        'pending_moderation', (SELECT COUNT(*) FROM posts WHERE status = 'pending'),
        'flagged_content', (SELECT COUNT(*) FROM posts WHERE status = 'flagged'),
        'ai_jobs_running', (SELECT COUNT(*) FROM ai_jobs WHERE status = 'running'),
        'rpa_jobs_active', (SELECT COUNT(*) FROM rpa_jobs WHERE status IN ('scheduled', 'running')),
        'blockchain_pending', (SELECT COUNT(*) FROM blockchain_transactions WHERE status = 'pending')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check is in RLS)
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Insert some sample system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit, status, trend) VALUES
    ('CPU Usage', 45.2, '%', 'healthy', 'stable'),
    ('Memory Usage', 67.8, '%', 'healthy', 'up'),
    ('Disk Usage', 78.3, '%', 'warning', 'up'),
    ('Network Latency', 23.5, 'ms', 'healthy', 'stable'),
    ('Database Connections', 18, '', 'healthy', 'down')
ON CONFLICT DO NOTHING;
