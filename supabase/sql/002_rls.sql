-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE listener_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "posts_select_policy" ON posts FOR SELECT USING (
  visibility = 'public' OR 
  user_id = auth.uid() OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = posts.user_id
  ))
);
CREATE POLICY "posts_insert_policy" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_policy" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_policy" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "comments_select_policy" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_policy" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_policy" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_policy" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "likes_select_policy" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_policy" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_policy" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "follows_select_policy" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_policy" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_policy" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Reels policies
CREATE POLICY "reels_select_policy" ON reels FOR SELECT USING (
  visibility = 'public' OR 
  user_id = auth.uid() OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = reels.user_id
  ))
);
CREATE POLICY "reels_insert_policy" ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reels_update_policy" ON reels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reels_delete_policy" ON reels FOR DELETE USING (auth.uid() = user_id);

-- Reel likes policies
CREATE POLICY "reel_likes_select_policy" ON reel_likes FOR SELECT USING (true);
CREATE POLICY "reel_likes_insert_policy" ON reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reel_likes_delete_policy" ON reel_likes FOR DELETE USING (auth.uid() = user_id);

-- Reel views policies
CREATE POLICY "reel_views_select_policy" ON reel_views FOR SELECT USING (true);
CREATE POLICY "reel_views_insert_policy" ON reel_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "conversations_select_policy" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);
CREATE POLICY "conversations_insert_policy" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "conversations_update_policy" ON conversations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);

-- Conversation participants policies
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
  )
);
CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id AND created_by = auth.uid()
  )
);

-- Messages policies
CREATE POLICY "messages_select_policy" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "messages_delete_policy" ON messages FOR DELETE USING (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "campaigns_select_policy" ON campaigns FOR SELECT USING (
  status = 'active' OR user_id = auth.uid()
);
CREATE POLICY "campaigns_insert_policy" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns_update_policy" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "campaigns_delete_policy" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Donations policies
CREATE POLICY "donations_select_policy" ON donations FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()
  )
);
CREATE POLICY "donations_insert_policy" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listeners policies
CREATE POLICY "listeners_select_policy" ON listeners FOR SELECT USING (is_active = true);
CREATE POLICY "listeners_insert_policy" ON listeners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listeners_update_policy" ON listeners FOR UPDATE USING (auth.uid() = user_id);

-- Listener slots policies
CREATE POLICY "listener_slots_select_policy" ON listener_slots FOR SELECT USING (true);
CREATE POLICY "listener_slots_insert_policy" ON listener_slots FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listeners WHERE user_id = auth.uid() AND id = listener_id)
);
CREATE POLICY "listener_slots_update_policy" ON listener_slots FOR UPDATE USING (
  EXISTS (SELECT 1 FROM listeners WHERE user_id = auth.uid() AND id = listener_id)
);
CREATE POLICY "listener_slots_delete_policy" ON listener_slots FOR DELETE USING (
  EXISTS (SELECT 1 FROM listeners WHERE user_id = auth.uid() AND id = listener_id)
);

-- Sessions policies
CREATE POLICY "sessions_select_policy" ON sessions FOR SELECT USING (
  seeker_id = auth.uid() OR listener_id IN (
    SELECT id FROM listeners WHERE user_id = auth.uid()
  )
);
CREATE POLICY "sessions_insert_policy" ON sessions FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "sessions_update_policy" ON sessions FOR UPDATE USING (
  seeker_id = auth.uid() OR listener_id IN (
    SELECT id FROM listeners WHERE user_id = auth.uid()
  )
);

-- Draws policies
CREATE POLICY "draws_select_policy" ON draws FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "draws_insert_policy" ON draws FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "draws_update_policy" ON draws FOR UPDATE USING (auth.uid() = user_id);

-- Draw entries policies
CREATE POLICY "draw_entries_select_policy" ON draw_entries FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM draws WHERE id = draw_id AND user_id = auth.uid()
  )
);
CREATE POLICY "draw_entries_insert_policy" ON draw_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "notifications_select_policy" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_policy" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "events_select_policy" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert_policy" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update_policy" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "events_delete_policy" ON events FOR DELETE USING (auth.uid() = user_id);

-- Event attendees policies
CREATE POLICY "event_attendees_select_policy" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "event_attendees_insert_policy" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_attendees_delete_policy" ON event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "payments_select_policy" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_policy" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "invoices_select_policy" ON invoices FOR SELECT USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "push_subscriptions_select_policy" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_insert_policy" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_update_policy" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_delete_policy" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Trending tags policies (public read)
CREATE POLICY "trending_tags_select_policy" ON trending_tags FOR SELECT USING (true);

-- User interactions policies
CREATE POLICY "user_interactions_select_policy" ON user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_interactions_insert_policy" ON user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "referrals_select_policy" ON referrals FOR SELECT USING (
  referrer_id = auth.uid() OR referred_id = auth.uid()
);
CREATE POLICY "referrals_insert_policy" ON referrals FOR INSERT WITH CHECK (
  auth.uid() = referred_id
);

-- Admin-only policies
CREATE POLICY "audit_logs_admin_policy" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "analytics_events_admin_policy" ON analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "moderation_reports_admin_policy" ON moderation_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "safety_scores_admin_policy" ON safety_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "rate_limits_admin_policy" ON rate_limits FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
