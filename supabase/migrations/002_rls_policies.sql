-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sahaya_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sahaya_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Feature access policies
CREATE POLICY "Users can view their own feature access" ON feature_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feature access" ON feature_access FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage feature access" ON feature_access FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage any post" ON posts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Post likes policies
CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage any comment" ON comments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Comment likes policies
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Campaigns policies
CREATE POLICY "Live campaigns are viewable by everyone" ON campaigns FOR SELECT USING (status = 'live' OR auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage any campaign" ON campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Donations policies
CREATE POLICY "Donations are viewable by campaign owner and donor" ON donations FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT owner_id FROM campaigns WHERE id = campaign_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated users can donate" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Draws policies
CREATE POLICY "Draws are viewable by everyone" ON draws FOR SELECT USING (true);
CREATE POLICY "Admins can manage draws" ON draws FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Draw entries policies
CREATE POLICY "Draw entries are viewable by everyone" ON draw_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can enter draws" ON draw_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);

-- Reels policies
CREATE POLICY "Reels are viewable by everyone" ON reels FOR SELECT USING (NOT is_hidden OR auth.uid() = author_id);
CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own reels" ON reels FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own reels" ON reels FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage any reel" ON reels FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Reel likes policies
CREATE POLICY "Reel likes are viewable by everyone" ON reel_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like reels" ON reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own reel likes" ON reel_likes FOR DELETE USING (auth.uid() = user_id);

-- Reel views policies
CREATE POLICY "Reel views are viewable by reel author" ON reel_views FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT author_id FROM reels WHERE id = reel_id)
);
CREATE POLICY "Authenticated users can record reel views" ON reel_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation participants policies
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Conversation creators can add participants" ON conversation_participants FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND created_by = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Sahaya listeners policies
CREATE POLICY "Listeners are viewable by everyone" ON sahaya_listeners FOR SELECT USING (is_active = true);
CREATE POLICY "Users can register as listeners" ON sahaya_listeners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their listener profile" ON sahaya_listeners FOR UPDATE USING (auth.uid() = user_id);

-- Sahaya sessions policies
CREATE POLICY "Users can view their own sessions" ON sahaya_sessions FOR SELECT USING (
    auth.uid() = listener_id OR auth.uid() = seeker_id
);
CREATE POLICY "Users can create sessions" ON sahaya_sessions FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "Listeners can update their sessions" ON sahaya_sessions FOR UPDATE USING (auth.uid() = listener_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "Admins can view all analytics" ON analytics_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "System can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Referrals policies
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referee_id
);
CREATE POLICY "System can manage referrals" ON referrals FOR ALL WITH CHECK (true);
