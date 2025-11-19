-- =====================================================
-- Mahakavya: Missing RLS Policies Script
-- =====================================================
-- This script adds RLS policies to tables that are missing them
-- Run this before production launch for complete security
-- =====================================================

-- notification_prefs table
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification prefs"
  ON notification_prefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification prefs"
  ON notification_prefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification prefs"
  ON notification_prefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- listeners table
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listeners"
  ON listeners FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage own listener profile"
  ON listeners FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all listeners"
  ON listeners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = listener_id 
    OR auth.uid() = seeker_id
  );

CREATE POLICY "Seekers can create sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Participants can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = listener_id 
    OR auth.uid() = seeker_id
  );

-- slots table
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available slots"
  ON slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Listeners can manage own slots"
  ON slots FOR ALL
  TO authenticated
  USING (auth.uid() = listener_id);

-- conversation_members table
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own memberships"
  ON conversation_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join conversations"
  ON conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own membership"
  ON conversation_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- presence table
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view presence in their conversations"
  ON presence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = presence.conversation_id
      AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own presence"
  ON presence FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- push_subscriptions table
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- Verification queries
-- =====================================================

-- Run these to verify policies were created successfully:

-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN (
--   'notification_prefs', 'listeners', 'sessions', 'slots',
--   'conversation_members', 'presence', 'reports', 'push_subscriptions'
-- )
-- ORDER BY tablename, policyname;

-- =====================================================
-- Complete! All tables now have RLS policies
-- =====================================================
