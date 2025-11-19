-- Enhanced Varta (Chat/Messaging) System Schema
-- This migration adds AI, Blockchain, and RPA features to the messaging system

-- AI Message Analysis Table
CREATE TABLE IF NOT EXISTS message_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    toxicity_score DECIMAL(3,2) CHECK (toxicity_score >= 0 AND toxicity_score <= 1),
    language_detected TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ai_suggestions JSONB DEFAULT '[]',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain Message Verification Table
CREATE TABLE IF NOT EXISTS message_blockchain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed')),
    integrity_hash TEXT NOT NULL,
    gas_used INTEGER,
    confirmations INTEGER DEFAULT 0,
    network_id TEXT DEFAULT 'ethereum-mainnet',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPA Message Processing Jobs Table
CREATE TABLE IF NOT EXISTS message_rpa_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL CHECK (job_type IN ('spam_detection', 'engagement_analysis', 'auto_moderation', 'sentiment_tracking')),
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message_ids UUID[] DEFAULT '{}',
    user_id UUID REFERENCES profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Analytics Table
CREATE TABLE IF NOT EXISTS message_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    conversation_id UUID REFERENCES conversations(id),
    message_count INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    peak_activity_hour INTEGER CHECK (peak_activity_hour >= 0 AND peak_activity_hour <= 23),
    most_active_day TEXT,
    ai_assistance_used BOOLEAN DEFAULT FALSE,
    blockchain_verified_count INTEGER DEFAULT 0,
    rpa_optimizations_applied INTEGER DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Reply Suggestions Table
CREATE TABLE IF NOT EXISTS smart_reply_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    suggested_replies JSONB DEFAULT '[]',
    context_analysis JSONB DEFAULT '{}',
    confidence_scores JSONB DEFAULT '{}',
    user_selected_reply TEXT,
    was_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation AI Insights Table
CREATE TABLE IF NOT EXISTS conversation_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('sentiment', 'language', 'engagement', 'suggestion')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    actionable BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Automation Settings Table
CREATE TABLE IF NOT EXISTS message_automation_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    spam_detection_enabled BOOLEAN DEFAULT TRUE,
    auto_moderation_enabled BOOLEAN DEFAULT TRUE,
    engagement_analysis_enabled BOOLEAN DEFAULT TRUE,
    sentiment_tracking_enabled BOOLEAN DEFAULT TRUE,
    smart_replies_enabled BOOLEAN DEFAULT TRUE,
    language_translation_enabled BOOLEAN DEFAULT TRUE,
    blockchain_verification_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_ai_analysis_message_id ON message_ai_analysis(message_id);
CREATE INDEX IF NOT EXISTS idx_message_ai_analysis_sentiment ON message_ai_analysis(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_message_ai_analysis_processed_at ON message_ai_analysis(processed_at);

CREATE INDEX IF NOT EXISTS idx_message_blockchain_records_message_id ON message_blockchain_records(message_id);
CREATE INDEX IF NOT EXISTS idx_message_blockchain_records_status ON message_blockchain_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_message_blockchain_records_block_number ON message_blockchain_records(block_number);

CREATE INDEX IF NOT EXISTS idx_message_rpa_jobs_status ON message_rpa_jobs(status);
CREATE INDEX IF NOT EXISTS idx_message_rpa_jobs_type ON message_rpa_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_message_rpa_jobs_user_id ON message_rpa_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_message_analytics_user_id ON message_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_message_analytics_date ON message_analytics(date);
CREATE INDEX IF NOT EXISTS idx_message_analytics_conversation_id ON message_analytics(conversation_id);

CREATE INDEX IF NOT EXISTS idx_smart_reply_suggestions_message_id ON smart_reply_suggestions(message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ai_insights_conversation_id ON conversation_ai_insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ai_insights_type ON conversation_ai_insights(insight_type);

-- Create RLS policies
ALTER TABLE message_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_rpa_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_reply_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_automation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_ai_analysis
CREATE POLICY "Users can view AI analysis of their messages" ON message_ai_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
            WHERE m.id = message_ai_analysis.message_id
            AND cm.user_id = auth.uid()
        )
    );

-- RLS Policies for message_blockchain_records
CREATE POLICY "Users can view blockchain records of their messages" ON message_blockchain_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
            WHERE m.id = message_blockchain_records.message_id
            AND cm.user_id = auth.uid()
        )
    );

-- RLS Policies for message_rpa_jobs
CREATE POLICY "Users can view their own RPA jobs" ON message_rpa_jobs
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for message_analytics
CREATE POLICY "Users can view their own message analytics" ON message_analytics
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for smart_reply_suggestions
CREATE POLICY "Users can view smart replies for their conversations" ON smart_reply_suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
            WHERE m.id = smart_reply_suggestions.message_id
            AND cm.user_id = auth.uid()
        )
    );

-- RLS Policies for conversation_ai_insights
CREATE POLICY "Users can view AI insights for their conversations" ON conversation_ai_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_members cm
            WHERE cm.conversation_id = conversation_ai_insights.conversation_id
            AND cm.user_id = auth.uid()
        )
    );

-- RLS Policies for message_automation_settings
CREATE POLICY "Users can manage their own automation settings" ON message_automation_settings
    FOR ALL USING (user_id = auth.uid());

-- Functions for message analytics
CREATE OR REPLACE FUNCTION update_message_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics for the sender
    INSERT INTO message_analytics (
        user_id,
        conversation_id,
        message_count,
        date
    )
    VALUES (
        NEW.sender_id,
        NEW.conversation_id,
        1,
        CURRENT_DATE
    )
    ON CONFLICT (user_id, date, conversation_id)
    DO UPDATE SET
        message_count = message_analytics.message_count + 1,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message analytics
DROP TRIGGER IF EXISTS trigger_update_message_analytics ON messages;
CREATE TRIGGER trigger_update_message_analytics
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_analytics();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    message_count INTEGER;
    conversation_count INTEGER;
    response_rate DECIMAL;
    engagement_score INTEGER;
BEGIN
    -- Get message count for the last 7 days
    SELECT COUNT(*) INTO message_count
    FROM messages
    WHERE sender_id = user_uuid
    AND created_at >= NOW() - INTERVAL '7 days';

    -- Get active conversation count
    SELECT COUNT(DISTINCT conversation_id) INTO conversation_count
    FROM conversation_members
    WHERE user_id = user_uuid;

    -- Calculate a simple engagement score
    engagement_score := LEAST(100, 
        (message_count * 2) + 
        (conversation_count * 5) + 
        CASE WHEN message_count > 0 THEN 20 ELSE 0 END
    );

    RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation insights
CREATE OR REPLACE FUNCTION get_conversation_insights(conv_id UUID)
RETURNS TABLE (
    total_messages BIGINT,
    unique_participants INTEGER,
    avg_message_length DECIMAL,
    most_active_hour INTEGER,
    sentiment_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(m.id) as total_messages,
        COUNT(DISTINCT m.sender_id)::INTEGER as unique_participants,
        AVG(LENGTH(m.body))::DECIMAL as avg_message_length,
        EXTRACT(HOUR FROM m.created_at)::INTEGER as most_active_hour,
        jsonb_build_object(
            'positive', COUNT(CASE WHEN mai.sentiment_label = 'positive' THEN 1 END),
            'neutral', COUNT(CASE WHEN mai.sentiment_label = 'neutral' THEN 1 END),
            'negative', COUNT(CASE WHEN mai.sentiment_label = 'negative' THEN 1 END)
        ) as sentiment_distribution
    FROM messages m
    LEFT JOIN message_ai_analysis mai ON m.id = mai.message_id
    WHERE m.conversation_id = conv_id
    GROUP BY EXTRACT(HOUR FROM m.created_at)
    ORDER BY COUNT(m.id) DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert default automation settings for existing users
INSERT INTO message_automation_settings (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM message_automation_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Create a function to automatically create automation settings for new users
CREATE OR REPLACE FUNCTION create_default_automation_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO message_automation_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user automation settings
DROP TRIGGER IF EXISTS trigger_create_automation_settings ON profiles;
CREATE TRIGGER trigger_create_automation_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_automation_settings();

-- Add some sample AI insights for demonstration
INSERT INTO conversation_ai_insights (conversation_id, insight_type, title, description, confidence, actionable)
SELECT 
    c.id,
    'engagement',
    'High Engagement Conversation',
    'This conversation shows high engagement with frequent back-and-forth messages.',
    0.85,
    false
FROM conversations c
WHERE EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.conversation_id = c.id 
    GROUP BY m.conversation_id 
    HAVING COUNT(*) > 10
)
LIMIT 5
ON CONFLICT DO NOTHING;
