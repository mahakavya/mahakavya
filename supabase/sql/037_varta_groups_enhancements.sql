-- Varta Groups Enhancement Schema
-- This file creates the necessary database structure for the Varta Groups feature

-- Create group_conversations table if not exists
CREATE TABLE IF NOT EXISTS group_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    privacy VARCHAR(20) DEFAULT 'private' CHECK (privacy IN ('public', 'private', 'secret')),
    category VARCHAR(50) DEFAULT 'general',
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    member_count INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 50,
    ai_enabled BOOLEAN DEFAULT false,
    blockchain_verified BOOLEAN DEFAULT false,
    rpa_automated BOOLEAN DEFAULT false,
    engagement_score INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create group_members table if not exists
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}'::jsonb,
    UNIQUE(group_id, user_id)
);

-- Create group_messages table if not exists
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_generated')),
    reply_to UUID REFERENCES group_messages(id) ON DELETE SET NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    ai_enhanced BOOLEAN DEFAULT false,
    blockchain_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create group_message_reactions table
CREATE TABLE IF NOT EXISTS group_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Create ai_group_insights table
CREATE TABLE IF NOT EXISTS ai_group_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('sentiment', 'engagement', 'topic', 'recommendation', 'prediction')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(5,2) DEFAULT 0.0,
    impact VARCHAR(20) DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
    actionable BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'dismissed'))
);

-- Create blockchain_group_records table
CREATE TABLE IF NOT EXISTS blockchain_group_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('message', 'member_join', 'member_leave', 'settings_change', 'verification')),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gas_used INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'failed')),
    verification_score INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create rpa_group_jobs table
CREATE TABLE IF NOT EXISTS rpa_group_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('moderation', 'engagement', 'analytics', 'notification', 'optimization')),
    status VARCHAR(20) DEFAULT 'paused' CHECK (status IN ('running', 'paused', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    actions_performed INTEGER DEFAULT 0,
    configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rpa_group_activities table
CREATE TABLE IF NOT EXISTS rpa_group_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    job_id UUID REFERENCES rpa_group_jobs(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    result VARCHAR(20) DEFAULT 'success' CHECK (result IN ('success', 'warning', 'error')),
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create group_analytics table
CREATE TABLE IF NOT EXISTS group_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    message_count INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    sentiment_score DECIMAL(5,2) DEFAULT 0.0,
    ai_insights_generated INTEGER DEFAULT 0,
    blockchain_verifications INTEGER DEFAULT 0,
    rpa_actions INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_conversations_created_by ON group_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_group_conversations_category ON group_conversations(category);
CREATE INDEX IF NOT EXISTS idx_group_conversations_privacy ON group_conversations(privacy);
CREATE INDEX IF NOT EXISTS idx_group_conversations_last_activity ON group_conversations(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to ON group_messages(reply_to);

CREATE INDEX IF NOT EXISTS idx_group_message_reactions_message_id ON group_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_group_message_reactions_user_id ON group_message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_group_insights_group_id ON ai_group_insights(group_id);
CREATE INDEX IF NOT EXISTS idx_ai_group_insights_type ON ai_group_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_group_insights_created_at ON ai_group_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blockchain_group_records_group_id ON blockchain_group_records(group_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_group_records_timestamp ON blockchain_group_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_group_records_status ON blockchain_group_records(status);

CREATE INDEX IF NOT EXISTS idx_rpa_group_jobs_group_id ON rpa_group_jobs(group_id);
CREATE INDEX IF NOT EXISTS idx_rpa_group_jobs_status ON rpa_group_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rpa_group_jobs_type ON rpa_group_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_rpa_group_activities_group_id ON rpa_group_activities(group_id);
CREATE INDEX IF NOT EXISTS idx_rpa_group_activities_timestamp ON rpa_group_activities(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_group_analytics_group_id ON group_analytics(group_id);
CREATE INDEX IF NOT EXISTS idx_group_analytics_date ON group_analytics(date DESC);

-- Create RLS policies
ALTER TABLE group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_group_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_group_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_group_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_conversations
CREATE POLICY "Users can view groups they are members of" ON group_conversations
    FOR SELECT USING (
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        ) OR privacy = 'public'
    );

CREATE POLICY "Users can create groups" ON group_conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups" ON group_conversations
    FOR UPDATE USING (
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for group_members
CREATE POLICY "Users can view members of their groups" ON group_members
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can manage members" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for group_messages
CREATE POLICY "Users can view messages in their groups" ON group_messages
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can send messages" ON group_messages
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        ) AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own messages" ON group_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for group_message_reactions
CREATE POLICY "Users can view reactions in their groups" ON group_message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM group_messages 
            WHERE group_id IN (
                SELECT group_id FROM group_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Group members can add reactions" ON group_message_reactions
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT id FROM group_messages 
            WHERE group_id IN (
                SELECT group_id FROM group_members 
                WHERE user_id = auth.uid()
            )
        ) AND auth.uid() = user_id
    );

-- RLS Policies for ai_group_insights
CREATE POLICY "Users can view insights for their groups" ON ai_group_insights
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for blockchain_group_records
CREATE POLICY "Users can view blockchain records for their groups" ON blockchain_group_records
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for rpa_group_jobs
CREATE POLICY "Users can view RPA jobs for their groups" ON rpa_group_jobs
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for rpa_group_activities
CREATE POLICY "Users can view RPA activities for their groups" ON rpa_group_activities
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for group_analytics
CREATE POLICY "Users can view analytics for their groups" ON group_analytics
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Create functions for group management
CREATE OR REPLACE FUNCTION update_group_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE group_conversations 
    SET last_activity = NOW() 
    WHERE id = NEW.group_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating group activity
DROP TRIGGER IF EXISTS trigger_update_group_activity ON group_messages;
CREATE TRIGGER trigger_update_group_activity
    AFTER INSERT ON group_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_group_last_activity();

-- Create function to update member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE group_conversations 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE group_conversations 
        SET member_count = member_count - 1 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for member count
DROP TRIGGER IF EXISTS trigger_update_member_count_insert ON group_members;
CREATE TRIGGER trigger_update_member_count_insert
    AFTER INSERT ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_member_count();

DROP TRIGGER IF EXISTS trigger_update_member_count_delete ON group_members;
CREATE TRIGGER trigger_update_member_count_delete
    AFTER DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_member_count();

-- Create function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_group_engagement_score(group_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    message_count INTEGER;
    member_count INTEGER;
    active_members INTEGER;
    engagement_score INTEGER;
BEGIN
    -- Get message count in last 7 days
    SELECT COUNT(*) INTO message_count
    FROM group_messages
    WHERE group_id = group_uuid
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Get total member count
    SELECT COUNT(*) INTO member_count
    FROM group_members
    WHERE group_id = group_uuid;
    
    -- Get active members in last 7 days
    SELECT COUNT(DISTINCT user_id) INTO active_members
    FROM group_messages
    WHERE group_id = group_uuid
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Calculate engagement score (0-100)
    IF member_count = 0 THEN
        engagement_score := 0;
    ELSE
        engagement_score := LEAST(100, 
            (active_members * 100 / member_count) + 
            (LEAST(message_count, 100) / 2)
        );
    END IF;
    
    RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for development
INSERT INTO group_conversations (name, description, privacy, category, created_by, ai_enabled, blockchain_verified, rpa_automated) 
SELECT 
    'Welcome to Mahakavya',
    'Official welcome group for new users',
    'public',
    'general',
    id,
    true,
    true,
    true
FROM profiles 
WHERE email LIKE '%admin%' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create view for group statistics
CREATE OR REPLACE VIEW group_stats AS
SELECT 
    gc.id,
    gc.name,
    gc.member_count,
    COUNT(gm.created_at) FILTER (WHERE gm.created_at >= NOW() - INTERVAL '24 hours') as messages_today,
    COUNT(DISTINCT gm.user_id) FILTER (WHERE gm.created_at >= NOW() - INTERVAL '7 days') as active_members_week,
    calculate_group_engagement_score(gc.id) as engagement_score
FROM group_conversations gc
LEFT JOIN group_messages gm ON gc.id = gm.group_id
GROUP BY gc.id, gc.name, gc.member_count;

COMMENT ON TABLE group_conversations IS 'Premium group conversations with AI, Blockchain, and RPA features';
COMMENT ON TABLE group_members IS 'Group membership and roles';
COMMENT ON TABLE group_messages IS 'Messages within group conversations';
COMMENT ON TABLE ai_group_insights IS 'AI-generated insights for group conversations';
COMMENT ON TABLE blockchain_group_records IS 'Blockchain verification records for group actions';
COMMENT ON TABLE rpa_group_jobs IS 'RPA automation jobs for group management';
