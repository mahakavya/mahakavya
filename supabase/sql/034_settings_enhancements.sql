-- Settings Management Schema Enhancements
-- This schema supports comprehensive user settings management with AI, Blockchain, and RPA integration

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    
    -- Indexes
    INDEX idx_user_settings_user_id (user_id),
    INDEX idx_user_settings_updated_at (updated_at DESC)
);

-- Settings change history
CREATE TABLE IF NOT EXISTS user_settings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings_id UUID REFERENCES user_settings(id),
    previous_settings JSONB,
    new_settings JSONB,
    change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'reset'
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_source VARCHAR(50), -- 'user', 'ai', 'rpa', 'system'
    change_reason TEXT,
    
    -- Indexes
    INDEX idx_settings_history_user_id (user_id),
    INDEX idx_settings_history_changed_at (changed_at DESC),
    INDEX idx_settings_history_change_type (change_type)
);

-- Blockchain verifications table
CREATE TABLE IF NOT EXISTS blockchain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_id VARCHAR(100) NOT NULL,
    blockchain_address VARCHAR(100),
    transaction_hash VARCHAR(100),
    profile_verified BOOLEAN DEFAULT false,
    identity_verified BOOLEAN DEFAULT false,
    content_verified BOOLEAN DEFAULT false,
    verification_data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(verification_id),
    
    -- Indexes
    INDEX idx_blockchain_verifications_user_id (user_id),
    INDEX idx_blockchain_verifications_status (status),
    INDEX idx_blockchain_verifications_created_at (created_at DESC)
);

-- Blockchain audit trail
CREATE TABLE IF NOT EXISTS blockchain_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    blockchain_address VARCHAR(100),
    transaction_hash VARCHAR(100),
    integrity_check BOOLEAN DEFAULT true,
    audit_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_blockchain_audits_user_id (user_id),
    INDEX idx_blockchain_audits_action (action),
    INDEX idx_blockchain_audits_created_at (created_at DESC)
);

-- RPA jobs table
CREATE TABLE IF NOT EXISTS rpa_jobs (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'settings_optimization', 'full_optimization', 'security_scan'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
    job_data JSONB,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_rpa_jobs_user_id (user_id),
    INDEX idx_rpa_jobs_status (status),
    INDEX idx_rpa_jobs_job_type (job_type),
    INDEX idx_rpa_jobs_created_at (created_at DESC)
);

-- RPA optimizations table
CREATE TABLE IF NOT EXISTS rpa_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id VARCHAR(100) REFERENCES rpa_jobs(id),
    optimization_type VARCHAR(50) NOT NULL,
    efficiency_score INTEGER DEFAULT 0,
    suggestions TEXT[],
    applied_changes TEXT[],
    optimization_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_rpa_optimizations_user_id (user_id),
    INDEX idx_rpa_optimizations_job_id (job_id),
    INDEX idx_rpa_optimizations_created_at (created_at DESC)
);

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'suspicious_login', 'multiple_failures', 'unusual_activity'
    severity VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    alert_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Indexes
    INDEX idx_security_alerts_user_id (user_id),
    INDEX idx_security_alerts_status (status),
    INDEX idx_security_alerts_severity (severity),
    INDEX idx_security_alerts_created_at (created_at DESC)
);

-- User preferences table (for additional customizations)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    category VARCHAR(50), -- 'ui', 'notifications', 'privacy', 'ai', 'blockchain', 'rpa'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, preference_key),
    
    -- Indexes
    INDEX idx_user_preferences_user_id (user_id),
    INDEX idx_user_preferences_category (category),
    INDEX idx_user_preferences_key (preference_key)
);

-- RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- User access policies
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their settings history" ON user_settings_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their blockchain verifications" ON blockchain_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their blockchain audits" ON blockchain_audits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their RPA jobs" ON rpa_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their RPA optimizations" ON rpa_optimizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their security alerts" ON security_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all settings" ON user_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admins can view all blockchain verifications" ON blockchain_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admins can manage RPA jobs" ON rpa_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admins can view security alerts" ON security_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

-- Functions for settings management
CREATE OR REPLACE FUNCTION update_user_settings_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings_history (
        user_id,
        settings_id,
        previous_settings,
        new_settings,
        change_type,
        change_source,
        change_reason
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        COALESCE(NEW.id, OLD.id),
        OLD.settings,
        NEW.settings,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        'user',
        'Settings updated by user'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for settings history
DROP TRIGGER IF EXISTS user_settings_history_trigger ON user_settings;
CREATE TRIGGER user_settings_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_user_settings_history();

-- Function to get user settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings_with_defaults(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_settings JSONB;
    default_settings JSONB := '{
        "theme": "system",
        "language": "en",
        "timezone": "Asia/Kolkata",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false,
            "marketing": false,
            "security": true,
            "social": true
        },
        "privacy": {
            "profileVisibility": "public",
            "showEmail": false,
            "showPhone": false,
            "allowMessages": true,
            "allowFriendRequests": true,
            "dataCollection": true,
            "analytics": true
        },
        "preferences": {
            "autoPlay": true,
            "highContrast": false,
            "reducedMotion": false,
            "compactMode": false,
            "showTips": true,
            "aiSuggestions": true
        },
        "security": {
            "twoFactorEnabled": false,
            "sessionTimeout": 60,
            "loginAlerts": true,
            "deviceTracking": true
        },
        "ai": {
            "personalizedContent": true,
            "smartNotifications": true,
            "contentModeration": true,
            "languageProcessing": true,
            "behaviorAnalysis": true
        },
        "blockchain": {
            "profileVerification": false,
            "contentSigning": false,
            "privacyMode": false,
            "auditTrail": true
        },
        "rpa": {
            "autoOptimization": true,
            "smartScheduling": false,
            "performanceMonitoring": true,
            "securityScanning": true
        }
    }';
BEGIN
    SELECT settings INTO user_settings
    FROM user_settings
    WHERE user_id = target_user_id;
    
    IF user_settings IS NULL THEN
        RETURN default_settings;
    ELSE
        RETURN default_settings || user_settings;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
    target_user_id UUID,
    alert_type VARCHAR(50),
    severity VARCHAR(10),
    alert_data JSONB
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO security_alerts (user_id, alert_type, severity, alert_data)
    VALUES (target_user_id, alert_type, severity, alert_data)
    RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user optimization score
CREATE OR REPLACE FUNCTION get_user_optimization_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    latest_optimization RECORD;
    base_score INTEGER := 70;
    security_score INTEGER := 0;
    settings_score INTEGER := 0;
BEGIN
    -- Get latest optimization
    SELECT efficiency_score INTO latest_optimization
    FROM rpa_optimizations
    WHERE user_id = target_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF latest_optimization.efficiency_score IS NOT NULL THEN
        base_score := latest_optimization.efficiency_score;
    END IF;
    
    -- Check security factors
    SELECT COUNT(*) INTO security_score
    FROM security_alerts
    WHERE user_id = target_user_id AND status = 'open';
    
    -- Deduct points for open security alerts
    base_score := base_score - (security_score * 5);
    
    -- Check if user has optimized settings
    SELECT COUNT(*) INTO settings_score
    FROM user_settings
    WHERE user_id = target_user_id;
    
    IF settings_score > 0 THEN
        base_score := base_score + 10;
    END IF;
    
    RETURN GREATEST(0, LEAST(100, base_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_settings_gin ON user_settings USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_blockchain_verifications_composite ON blockchain_verifications(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rpa_jobs_composite ON rpa_jobs(user_id, status, job_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_composite ON security_alerts(user_id, status, severity);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;
GRANT SELECT ON user_settings_history TO authenticated;
GRANT SELECT ON blockchain_verifications TO authenticated;
GRANT SELECT ON blockchain_audits TO authenticated;
GRANT SELECT ON rpa_jobs TO authenticated;
GRANT SELECT ON rpa_optimizations TO authenticated;
GRANT SELECT ON security_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'Stores comprehensive user settings and preferences';
COMMENT ON TABLE user_settings_history IS 'Tracks all changes to user settings for audit purposes';
COMMENT ON TABLE blockchain_verifications IS 'Manages blockchain-based profile and content verification';
COMMENT ON TABLE blockchain_audits IS 'Maintains blockchain audit trail for all user actions';
COMMENT ON TABLE rpa_jobs IS 'Tracks RPA automation jobs for user optimization';
COMMENT ON TABLE rpa_optimizations IS 'Stores results of RPA optimization processes';
COMMENT ON TABLE security_alerts IS 'Manages security alerts and notifications for users';
COMMENT ON TABLE user_preferences IS 'Stores additional user preferences and customizations';
