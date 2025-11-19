-- Platform Settings Management Schema
-- This schema supports comprehensive platform configuration management

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_settings CHECK (settings IS NOT NULL)
);

-- Settings change history
CREATE TABLE IF NOT EXISTS platform_settings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings_id UUID REFERENCES platform_settings(id),
    previous_settings JSONB,
    new_settings JSONB,
    change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT,
    
    -- Indexes
    INDEX idx_settings_history_settings_id (settings_id),
    INDEX idx_settings_history_changed_at (changed_at),
    INDEX idx_settings_history_changed_by (changed_by)
);

-- System status monitoring
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'down'
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'down')),
    
    -- Indexes
    INDEX idx_system_status_service (service_name),
    INDEX idx_system_status_last_check (last_check),
    UNIQUE(service_name)
);

-- Configuration templates
CREATE TABLE IF NOT EXISTS settings_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_settings JSONB NOT NULL,
    category VARCHAR(50), -- 'development', 'staging', 'production', 'maintenance'
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_template_name UNIQUE(name),
    
    -- Indexes
    INDEX idx_settings_templates_category (category),
    INDEX idx_settings_templates_created_at (created_at)
);

-- Service configuration
CREATE TABLE IF NOT EXISTS service_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(service_name),
    
    -- Indexes
    INDEX idx_service_config_service (service_name),
    INDEX idx_service_config_updated (last_updated)
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    rollout_percentage INTEGER DEFAULT 0,
    target_users JSONB, -- Array of user IDs or criteria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_flag_name UNIQUE(flag_name),
    CONSTRAINT valid_rollout_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Indexes
    INDEX idx_feature_flags_name (flag_name),
    INDEX idx_feature_flags_enabled (is_enabled)
);

-- Settings validation rules
CREATE TABLE IF NOT EXISTS settings_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_path VARCHAR(200) NOT NULL, -- e.g., 'ai.maxTokens', 'security.sessionTimeout'
    validation_type VARCHAR(50) NOT NULL, -- 'range', 'enum', 'regex', 'required'
    validation_config JSONB NOT NULL,
    error_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_validation_rules_path (setting_path),
    INDEX idx_validation_rules_active (is_active)
);

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_validation_rules ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admin access to platform_settings" ON platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admin access to platform_settings_history" ON platform_settings_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admin access to system_status" ON system_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admin access to settings_templates" ON settings_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admin access to service_configurations" ON service_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admin access to feature_flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admin access to settings_validation_rules" ON settings_validation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'master_admin')
        )
    );

-- Functions for settings management
CREATE OR REPLACE FUNCTION update_platform_settings_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO platform_settings_history (
        settings_id,
        previous_settings,
        new_settings,
        change_type,
        changed_by,
        change_reason
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        OLD.settings,
        NEW.settings,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        COALESCE(NEW.updated_by, OLD.updated_by),
        'Automatic change tracking'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for settings history
DROP TRIGGER IF EXISTS platform_settings_history_trigger ON platform_settings;
CREATE TRIGGER platform_settings_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON platform_settings
    FOR EACH ROW EXECUTE FUNCTION update_platform_settings_history();

-- Function to validate settings
CREATE OR REPLACE FUNCTION validate_platform_settings(settings_data JSONB)
RETURNS TABLE(is_valid BOOLEAN, errors TEXT[]) AS $$
DECLARE
    validation_errors TEXT[] := '{}';
    rule RECORD;
    setting_value JSONB;
BEGIN
    -- Check validation rules
    FOR rule IN SELECT * FROM settings_validation_rules WHERE is_active = true LOOP
        -- Extract the setting value using the path
        setting_value := settings_data #> string_to_array(rule.setting_path, '.');
        
        -- Validate based on rule type
        CASE rule.validation_type
            WHEN 'required' THEN
                IF setting_value IS NULL THEN
                    validation_errors := array_append(validation_errors, 
                        COALESCE(rule.error_message, rule.setting_path || ' is required'));
                END IF;
            
            WHEN 'range' THEN
                IF setting_value IS NOT NULL AND (
                    (setting_value::numeric < (rule.validation_config->>'min')::numeric) OR
                    (setting_value::numeric > (rule.validation_config->>'max')::numeric)
                ) THEN
                    validation_errors := array_append(validation_errors, 
                        COALESCE(rule.error_message, rule.setting_path || ' is out of range'));
                END IF;
        END CASE;
    END LOOP;
    
    RETURN QUERY SELECT array_length(validation_errors, 1) IS NULL OR array_length(validation_errors, 1) = 0, validation_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health status
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE(
    total_services INTEGER,
    healthy_services INTEGER,
    degraded_services INTEGER,
    down_services INTEGER,
    overall_status VARCHAR(20)
) AS $$
DECLARE
    total_count INTEGER;
    healthy_count INTEGER;
    degraded_count INTEGER;
    down_count INTEGER;
    overall VARCHAR(20);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'healthy'),
        COUNT(*) FILTER (WHERE status = 'degraded'),
        COUNT(*) FILTER (WHERE status = 'down')
    INTO total_count, healthy_count, degraded_count, down_count
    FROM system_status;
    
    -- Determine overall status
    IF down_count > 0 THEN
        overall := 'down';
    ELSIF degraded_count > 0 THEN
        overall := 'degraded';
    ELSE
        overall := 'healthy';
    END IF;
    
    RETURN QUERY SELECT total_count, healthy_count, degraded_count, down_count, overall;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default validation rules
INSERT INTO settings_validation_rules (setting_path, validation_type, validation_config, error_message) VALUES
('ai.maxTokens', 'range', '{"min": 1, "max": 4000}', 'AI max tokens must be between 1 and 4000'),
('ai.temperature', 'range', '{"min": 0, "max": 2}', 'AI temperature must be between 0 and 2'),
('security.sessionTimeout', 'range', '{"min": 5, "max": 1440}', 'Session timeout must be between 5 and 1440 minutes'),
('security.maxLoginAttempts', 'range', '{"min": 1, "max": 10}', 'Max login attempts must be between 1 and 10'),
('security.passwordMinLength', 'range', '{"min": 6, "max": 128}', 'Password minimum length must be between 6 and 128'),
('rpa.maxConcurrentJobs', 'range', '{"min": 1, "max": 50}', 'RPA max concurrent jobs must be between 1 and 50'),
('performance.maxRequestsPerMinute', 'range', '{"min": 10, "max": 10000}', 'Max requests per minute must be between 10 and 10000')
ON CONFLICT (setting_path) DO NOTHING;

-- Insert default templates
INSERT INTO settings_templates (name, description, template_settings, category, is_default) VALUES
('Development', 'Development environment settings', '{
    "general": {"maintenanceMode": false, "registrationEnabled": true, "maxUsersPerDay": 100},
    "ai": {"enabled": true, "contentModerationEnabled": false},
    "security": {"twoFactorRequired": false, "sessionTimeout": 120},
    "performance": {"cacheEnabled": false, "rateLimitEnabled": false}
}', 'development', true),
('Production', 'Production environment settings', '{
    "general": {"maintenanceMode": false, "registrationEnabled": true, "maxUsersPerDay": 1000},
    "ai": {"enabled": true, "contentModerationEnabled": true},
    "security": {"twoFactorRequired": true, "sessionTimeout": 60},
    "performance": {"cacheEnabled": true, "rateLimitEnabled": true}
}', 'production', false),
('Maintenance', 'Maintenance mode settings', '{
    "general": {"maintenanceMode": true, "registrationEnabled": false, "maxUsersPerDay": 0},
    "ai": {"enabled": false},
    "security": {"sessionTimeout": 30},
    "performance": {"cacheEnabled": true, "rateLimitEnabled": true}
}', 'maintenance', false)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_settings_active ON platform_settings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_at ON platform_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_status_composite ON system_status(service_name, last_check DESC);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_settings_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_status TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO authenticated;
GRANT SELECT ON settings_validation_rules TO authenticated;

-- Comments for documentation
COMMENT ON TABLE platform_settings IS 'Stores platform-wide configuration settings';
COMMENT ON TABLE platform_settings_history IS 'Tracks all changes to platform settings for audit purposes';
COMMENT ON TABLE system_status IS 'Monitors the health status of various system services';
COMMENT ON TABLE settings_templates IS 'Predefined configuration templates for different environments';
COMMENT ON TABLE service_configurations IS 'Individual service-specific configurations';
COMMENT ON TABLE feature_flags IS 'Feature flag management for gradual rollouts';
COMMENT ON TABLE settings_validation_rules IS 'Validation rules for settings to ensure data integrity';
