-- Create user signin logs table
CREATE TABLE IF NOT EXISTS user_signin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    blockchain_hash TEXT,
    ai_verified BOOLEAN DEFAULT false,
    remember_me BOOLEAN DEFAULT false,
    signin_timestamp TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    remember_me BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'hi',
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add signin_count to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS signin_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_signin TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signin_logs_user_id ON user_signin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_signin_logs_timestamp ON user_signin_logs(signin_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);

-- Create RLS policies
ALTER TABLE user_signin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Signin logs policies
CREATE POLICY "Users can view own signin logs" ON user_signin_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert signin logs" ON user_signin_logs
    FOR INSERT WITH CHECK (true);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- User activity policies
CREATE POLICY "Users can view own activity" ON user_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity" ON user_activity
    FOR INSERT WITH CHECK (true);

-- User notifications policies
CREATE POLICY "Users can manage own notifications" ON user_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Create function to sync user data
CREATE OR REPLACE FUNCTION sync_user_data(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user's last activity
    UPDATE profiles 
    SET last_activity = NOW()
    WHERE id = user_id;
    
    -- Clean old activity logs (keep last 1000 entries per user)
    DELETE FROM user_activity 
    WHERE user_id = sync_user_data.user_id 
    AND id NOT IN (
        SELECT id FROM user_activity 
        WHERE user_id = sync_user_data.user_id 
        ORDER BY timestamp DESC 
        LIMIT 1000
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update signin count
CREATE OR REPLACE FUNCTION update_signin_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET signin_count = COALESCE(signin_count, 0) + 1,
        last_signin = NEW.signin_timestamp
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_signin_count
    AFTER INSERT ON user_signin_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_signin_count();
