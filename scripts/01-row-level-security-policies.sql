-- Comprehensive Row Level Security (RLS) policies for all tables
-- This script adds missing RLS policies to secure the database

-- ============================================================================
-- ENABLE RLS ON ALL TABLES (if not already enabled)
-- ============================================================================

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE delete_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONVERSATION MEMBERS POLICIES
-- ============================================================================

-- Users can view conversations they are members of
CREATE POLICY "Users can view own conversation memberships"
ON conversation_members FOR SELECT
USING (auth.uid() = user_id);

-- Users can join conversations (insert membership)
CREATE POLICY "Users can join conversations"
ON conversation_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can leave conversations (delete membership)
CREATE POLICY "Users can leave conversations"
ON conversation_members FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all conversation memberships
CREATE POLICY "Admins can manage all conversation memberships"
ON conversation_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- DELETE REQUESTS POLICIES
-- ============================================================================

-- Users can view their own delete requests
CREATE POLICY "Users can view own delete requests"
ON delete_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create delete requests for themselves
CREATE POLICY "Users can create delete requests"
ON delete_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all delete requests
CREATE POLICY "Admins can manage delete requests"
ON delete_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- EVENTS POLICIES (Analytics)
-- ============================================================================

-- Users can create their own events
CREATE POLICY "Users can create own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- LISTENERS POLICIES (Peer Support)
-- ============================================================================

-- Anyone can view active listeners
CREATE POLICY "Anyone can view active listeners"
ON listeners FOR SELECT
USING (is_active = true);

-- Users can create their own listener profile
CREATE POLICY "Users can create listener profile"
ON listeners FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own listener profile
CREATE POLICY "Users can update own listener profile"
ON listeners FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all listeners
CREATE POLICY "Admins can manage all listeners"
ON listeners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================================

-- Users can view their own notification preferences
CREATE POLICY "Users can view own notification prefs"
ON notification_prefs FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification prefs"
ON notification_prefs FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification prefs"
ON notification_prefs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRESENCE POLICIES (Real-time presence)
-- ============================================================================

-- Users can view presence in conversations they're part of
CREATE POLICY "Users can view presence in own conversations"
ON presence FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = presence.conversation_id
    AND user_id = auth.uid()
  )
);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
ON presence FOR ALL
USING (auth.uid() = user_id);

-- ============================================================================
-- REPORTS POLICIES (Content Moderation)
-- ============================================================================

-- Users can create reports
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = reporter_id);

-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports"
ON reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- SESSIONS POLICIES (Peer Support Sessions)
-- ============================================================================

-- Users can view sessions they are involved in (as seeker or listener)
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (
  auth.uid() = seeker_id OR 
  auth.uid() = listener_id
);

-- Seekers can create sessions
CREATE POLICY "Seekers can create sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = seeker_id);

-- Users can update sessions they are involved in
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
USING (
  auth.uid() = seeker_id OR 
  auth.uid() = listener_id
);

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
ON sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- SLOTS POLICIES (Listener Availability)
-- ============================================================================

-- Anyone can view available slots
CREATE POLICY "Anyone can view available slots"
ON slots FOR SELECT
USING (is_booked = false OR auth.uid() IS NOT NULL);

-- Listeners can create their own slots
CREATE POLICY "Listeners can create own slots"
ON slots FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM listeners
    WHERE user_id = auth.uid()
  )
);

-- Listeners can update their own slots
CREATE POLICY "Listeners can update own slots"
ON slots FOR UPDATE
USING (
  auth.uid() = listener_id
);

-- Listeners can delete their own slots
CREATE POLICY "Listeners can delete own slots"
ON slots FOR DELETE
USING (
  auth.uid() = listener_id
);

-- Admins can manage all slots
CREATE POLICY "Admins can manage all slots"
ON slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================================================
-- DOC COUNTERS - No RLS needed (internal system table)
-- ============================================================================

-- This table is used for internal document numbering and doesn't need RLS

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

-- Check RLS status on all tables
DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== RLS STATUS SUMMARY ===';
  
  FOR table_record IN 
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = table_record.schemaname
    AND tablename = table_record.tablename;
    
    RAISE NOTICE 'Table: % | RLS: % | Policies: %', 
      table_record.tablename,
      CASE WHEN table_record.rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END,
      policy_count;
  END LOOP;
END $$;
