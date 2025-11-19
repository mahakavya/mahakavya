-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);

-- Feature access indexes
CREATE INDEX idx_feature_access_user_id ON feature_access(user_id);
CREATE INDEX idx_feature_access_feature_name ON feature_access(feature_name);

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_posts_content_search ON posts USING GIN(to_tsvector('english', content));

-- Post likes indexes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Comment likes indexes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followee_id ON follows(followee_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);

-- Campaigns indexes
CREATE INDEX idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX idx_campaigns_is_featured ON campaigns(is_featured);
CREATE INDEX idx_campaigns_search ON campaigns USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Donations indexes
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Draws indexes
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_draw_at ON draws(draw_at);
CREATE INDEX idx_draws_created_at ON draws(created_at);

-- Draw entries indexes
CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_draw_entries_created_at ON draw_entries(created_at);

-- Reels indexes
CREATE INDEX idx_reels_author_id ON reels(author_id);
CREATE INDEX idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX idx_reels_is_hidden ON reels(is_hidden);
CREATE INDEX idx_reels_views ON reels(views DESC);
CREATE INDEX idx_reels_likes ON reels(likes DESC);

-- Reel likes indexes
CREATE INDEX idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX idx_reel_likes_user_id ON reel_likes(user_id);

-- Reel views indexes
CREATE INDEX idx_reel_views_reel_id ON reel_views(reel_id);
CREATE INDEX idx_reel_views_user_id ON reel_views(user_id);
CREATE INDEX idx_reel_views_created_at ON reel_views(created_at);

-- Conversations indexes
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Conversation participants indexes
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Sahaya listeners indexes
CREATE INDEX idx_sahaya_listeners_is_active ON sahaya_listeners(is_active);
CREATE INDEX idx_sahaya_listeners_is_verified ON sahaya_listeners(is_verified);
CREATE INDEX idx_sahaya_listeners_rating ON sahaya_listeners(rating DESC);
CREATE INDEX idx_sahaya_listeners_expertise ON sahaya_listeners USING GIN(expertise);
CREATE INDEX idx_sahaya_listeners_languages ON sahaya_listeners USING GIN(languages);

-- Sahaya sessions indexes
CREATE INDEX idx_sahaya_sessions_listener_id ON sahaya_sessions(listener_id);
CREATE INDEX idx_sahaya_sessions_seeker_id ON sahaya_sessions(seeker_id);
CREATE INDEX idx_sahaya_sessions_status ON sahaya_sessions(status);
CREATE INDEX idx_sahaya_sessions_scheduled_at ON sahaya_sessions(scheduled_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Analytics events indexes
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Reports indexes
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_content_type ON reports(content_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Referrals indexes
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_status ON referrals(status);
