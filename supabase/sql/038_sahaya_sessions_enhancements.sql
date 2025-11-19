-- Enhanced Sahaya Sessions Schema

-- Add session-specific fields to existing sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60; -- in minutes
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'video';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'medium';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Create session recordings table for future video/audio storage
CREATE TABLE IF NOT EXISTS session_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    recording_url TEXT,
    recording_type TEXT NOT NULL, -- 'video', 'audio', 'transcript'
    duration INTEGER, -- in seconds
    file_size BIGINT, -- in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Create session participants table for group sessions (future)
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'listener', 'seeker', 'observer'
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session ratings table
CREATE TABLE IF NOT EXISTS session_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, rater_id, rated_id)
);

-- Create session analytics table
CREATE TABLE IF NOT EXISTS session_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analytics_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_status_scheduled ON sessions(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_recordings_session_id ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_expires ON session_recordings(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_user ON session_participants(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings_session_id ON session_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings_rated_id ON session_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_user_id ON session_analytics(user_id);

-- Add RLS policies
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Session recordings policies
CREATE POLICY "Users can view recordings of their sessions" ON session_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.id = session_recordings.session_id 
            AND (s.seeker_id = auth.uid() OR s.listener_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert recordings of their sessions" ON session_recordings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.id = session_recordings.session_id 
            AND (s.seeker_id = auth.uid() OR s.listener_id = auth.uid())
        )
    );

-- Session participants policies
CREATE POLICY "Users can view participants of their sessions" ON session_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.id = session_participants.session_id 
            AND (s.seeker_id = auth.uid() OR s.listener_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert themselves as participants" ON session_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session ratings policies
CREATE POLICY "Users can view ratings for their sessions" ON session_ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.id = session_ratings.session_id 
            AND (s.seeker_id = auth.uid() OR s.listener_id = auth.uid())
        )
    );

CREATE POLICY "Users can rate their session partners" ON session_ratings
    FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can update their own ratings" ON session_ratings
    FOR UPDATE USING (auth.uid() = rater_id);

-- Session analytics policies
CREATE POLICY "Users can view their own analytics" ON session_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON session_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get session statistics
CREATE OR REPLACE FUNCTION get_session_statistics(user_uuid UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    completed_sessions BIGINT,
    scheduled_sessions BIGINT,
    cancelled_sessions BIGINT,
    total_hours NUMERIC,
    average_rating NUMERIC,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_sessions,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_sessions,
        COALESCE(SUM(duration), 0)::NUMERIC / 60 as total_hours,
        COALESCE(AVG(rating), 0) as average_rating,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
            ELSE 0 
        END as completion_rate
    FROM sessions 
    WHERE seeker_id = user_uuid OR listener_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule a session with validation
CREATE OR REPLACE FUNCTION schedule_session(
    p_seeker_id UUID,
    p_listener_id UUID,
    p_slot_id UUID,
    p_session_type TEXT,
    p_duration INTEGER,
    p_topic TEXT DEFAULT NULL,
    p_urgency TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    slot_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get slot start time and verify it's available
    SELECT start_at INTO slot_start
    FROM slots 
    WHERE id = p_slot_id AND is_booked = false AND listener_id = p_listener_id;
    
    IF slot_start IS NULL THEN
        RAISE EXCEPTION 'Slot not available';
    END IF;
    
    -- Check if slot is at least 10 minutes in the future
    IF slot_start <= NOW() + INTERVAL '10 minutes' THEN
        RAISE EXCEPTION 'Slot must be at least 10 minutes in the future';
    END IF;
    
    -- Create the session
    INSERT INTO sessions (
        seeker_id,
        listener_id,
        slot_id,
        status,
        scheduled_at,
        duration,
        session_type,
        topic,
        urgency,
        ai_enhanced,
        blockchain_verified,
        created_at
    ) VALUES (
        p_seeker_id,
        p_listener_id,
        p_slot_id,
        'scheduled',
        slot_start,
        p_duration,
        p_session_type,
        p_topic,
        p_urgency,
        true,
        true,
        NOW()
    ) RETURNING id INTO session_id;
    
    -- Mark slot as booked
    UPDATE slots SET is_booked = true WHERE id = p_slot_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a session with rating
CREATE OR REPLACE FUNCTION complete_session_with_rating(
    p_session_id UUID,
    p_rater_id UUID,
    p_rating INTEGER,
    p_feedback TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record RECORD;
    rated_user_id UUID;
BEGIN
    -- Get session details
    SELECT * INTO session_record FROM sessions WHERE id = p_session_id;
    
    IF session_record IS NULL THEN
        RAISE EXCEPTION 'Session not found';
    END IF;
    
    -- Determine who is being rated
    IF session_record.seeker_id = p_rater_id THEN
        rated_user_id := session_record.listener_id;
    ELSIF session_record.listener_id = p_rater_id THEN
        rated_user_id := session_record.seeker_id;
    ELSE
        RAISE EXCEPTION 'User not part of this session';
    END IF;
    
    -- Update session status if not already completed
    IF session_record.status != 'completed' THEN
        UPDATE sessions 
        SET status = 'completed', completed_at = NOW()
        WHERE id = p_session_id;
    END IF;
    
    -- Insert or update rating
    INSERT INTO session_ratings (session_id, rater_id, rated_id, rating, feedback)
    VALUES (p_session_id, p_rater_id, rated_user_id, p_rating, p_feedback)
    ON CONFLICT (session_id, rater_id, rated_id) 
    DO UPDATE SET rating = EXCLUDED.rating, feedback = EXCLUDED.feedback;
    
    -- Update listener's average rating if they were rated
    IF rated_user_id IN (SELECT user_id FROM listeners) THEN
        UPDATE listeners 
        SET rating = (
            SELECT AVG(rating::NUMERIC) 
            FROM session_ratings 
            WHERE rated_id = rated_user_id
        ),
        total_sessions = total_sessions + 1
        WHERE user_id = rated_user_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired recordings
CREATE OR REPLACE FUNCTION cleanup_expired_recordings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_recordings WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing sessions to have proper scheduled_at values
UPDATE sessions 
SET scheduled_at = COALESCE(
    (SELECT start_at FROM slots WHERE slots.id = sessions.slot_id),
    created_at + INTERVAL '1 hour'
)
WHERE scheduled_at IS NULL;

-- Update existing sessions to have session_type
UPDATE sessions 
SET session_type = 'video'
WHERE session_type IS NULL;

COMMIT;
