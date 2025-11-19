-- Foreign Key Indexes
create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_payments_user_id on payments(user_id);
create index idx_payments_order_id on payments(order_id);
create index idx_feature_access_user_id on feature_access(user_id);

create index idx_posts_author_id on posts(author_id);
create index idx_post_likes_post_id on post_likes(post_id);
create index idx_post_likes_user_id on post_likes(user_id);
create index idx_post_comments_post_id on post_comments(post_id);
create index idx_post_comments_author_id on post_comments(author_id);

create index idx_reels_author_id on reels(author_id);
create index idx_reel_likes_reel_id on reel_likes(reel_id);
create index idx_reel_likes_user_id on reel_likes(user_id);

create index idx_conversations_created_by on conversations(created_by);
create index idx_conversation_members_conversation_id on conversation_members(conversation_id);
create index idx_conversation_members_user_id on conversation_members(user_id);
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_sender_id on messages(sender_id);

create index idx_campaigns_owner_id on campaigns(owner_id);
create index idx_donations_campaign_id on donations(campaign_id);
create index idx_donations_user_id on donations(user_id);

create index idx_listeners_user_id on listeners(user_id);
create index idx_slots_listener_id on slots(listener_id);
create index idx_sessions_listener_id on sessions(listener_id);
create index idx_sessions_seeker_id on sessions(seeker_id);
create index idx_sessions_slot_id on sessions(slot_id);

create index idx_entries_draw_id on entries(draw_id);
create index idx_entries_user_id on entries(user_id);

create index idx_reports_reporter_id on reports(reporter_id);
create index idx_reports_entity_type_id on reports(entity_type, entity_id);

create index idx_events_user_id on events(user_id);
create index idx_audit_logs_user_id on audit_logs(user_id);

create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where read_at is null;

create index idx_push_subscriptions_user on push_subscriptions(user_id);
create index idx_safety_flags_entity on safety_flags(entity_type, entity_id);
create index idx_safety_flags_status on safety_flags(status);

create index idx_rate_events_user_route on rate_events(user_id, route, created_at desc);
create index idx_rate_events_ip_route on rate_events(ip, route, created_at desc);

create index idx_delete_requests_user on delete_requests(user_id);

-- Time-based Indexes
create index idx_posts_created_at on posts(created_at desc);
create index idx_post_comments_created_at on post_comments(created_at desc);
create index idx_reels_created_at on reels(created_at desc);
create index idx_messages_created_at on messages(created_at desc);
create index idx_campaigns_created_at on campaigns(created_at desc);
create index idx_donations_created_at on donations(created_at desc);
create index idx_sessions_created_at on sessions(created_at desc);
create index idx_draws_created_at on draws(created_at desc);
create index idx_events_created_at on events(created_at desc);
create index idx_audit_logs_created_at on audit_logs(created_at desc);

-- Profile indexes
create index idx_profiles_active on profiles(is_active);
create index idx_profiles_admin on profiles(is_admin);

-- Presence indexes
create index idx_presence_user on presence(user_id);
create index idx_presence_conversation on presence(conversation_id);
create index idx_presence_last_seen on presence(last_seen desc);

-- Conversation member indexes
create index idx_conv_members_user on conversation_members(user_id);
create index idx_messages_conv_created on messages(conversation_id, created_at desc);

-- Campaign and donation indexes
create index idx_campaigns_owner on campaigns(owner_id);
create index idx_campaigns_status on campaigns(status);
create index idx_donations_campaign on donations(campaign_id);
create index idx_donations_user on donations(user_id);

-- Listener and session indexes
create index idx_listeners_active on listeners(is_active);
create index idx_listeners_user on listeners(user_id);
create index idx_slots_listener_start on slots(listener_id, start_at);
create index idx_slots_listener_end on slots(listener_id, end_at);
create index idx_sessions_listener on sessions(listener_id);
create index idx_sessions_seeker on sessions(seeker_id);
create index idx_sessions_status on sessions(status);

-- Draw indexes
create index idx_draws_status on draws(status);
create index idx_draws_draw_at on draws(draw_at);
create index idx_entries_draw on entries(draw_id);
create index idx_entries_user on entries(user_id);

-- GIN Indexes for arrays and jsonb
create index idx_posts_tags on posts using gin(tags);
create index idx_events_props on events using gin(props);
create index idx_audit_logs_meta on audit_logs using gin(meta);
create index idx_payments_meta on payments using gin(meta);

-- Partial Indexes
create index idx_campaigns_live_status on campaigns(status) where status = 'live';
create index idx_draws_upcoming_status on draws(status) where status = 'upcoming';
create index idx_listeners_active_partial on listeners(is_active) where is_active = true;
create index idx_slots_available on slots(is_booked) where is_booked = false;
create index idx_reports_open_status on reports(status) where status = 'open';

-- Composite Indexes for common queries
create index idx_posts_author_created on posts(author_id, created_at desc);
create index idx_messages_conversation_created on messages(conversation_id, created_at desc);
create index idx_donations_campaign_created on donations(campaign_id, created_at desc);
create index idx_sessions_listener_status on sessions(listener_id, status);
create index idx_campaigns_owner_status on campaigns(owner_id, status);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee_id ON follows(followee_id);

CREATE INDEX IF NOT EXISTS idx_reels_author_id ON reels(author_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_is_hidden ON reels(is_hidden);

CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user_id ON reel_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_reel_views_reel_id ON reel_views(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_views_user_id ON reel_views(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

CREATE INDEX IF NOT EXISTS idx_listeners_is_active ON listeners(is_active);

CREATE INDEX IF NOT EXISTS idx_slots_listener_id ON slots(listener_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_at ON slots(start_at);
CREATE INDEX IF NOT EXISTS idx_slots_is_booked ON slots(is_booked);

CREATE INDEX IF NOT EXISTS idx_sessions_listener_id ON sessions(listener_id);
CREATE INDEX IF NOT EXISTS idx_sessions_seeker_id ON sessions(seeker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_draws_draw_at ON draws(draw_at);

CREATE INDEX IF NOT EXISTS idx_entries_draw_id ON entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_entity_type_id ON reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_name ON event_logs(name);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
