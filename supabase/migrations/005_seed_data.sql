-- Insert sample lucky draws
INSERT INTO draws (id, title, description, prize_description, prize_value, max_entries, entry_cost, status, start_date, end_date) VALUES
(
    uuid_generate_v4(),
    'Weekly Smartphone Giveaway',
    'Win the latest smartphone in our weekly lucky draw! Entry is free for all registered users.',
    'Latest Android Smartphone (64GB)',
    25000.00,
    1000,
    0.00,
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days'
),
(
    uuid_generate_v4(),
    'Monthly Laptop Prize',
    'Premium laptop giveaway for our community members. Small entry fee helps maintain the platform.',
    'Gaming Laptop (16GB RAM, 512GB SSD)',
    75000.00,
    500,
    100.00,
    'upcoming',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '37 days'
),
(
    uuid_generate_v4(),
    'Festival Special - Gold Coin',
    'Celebrate the festival season with a chance to win gold coins!',
    '10 Gram Gold Coin',
    50000.00,
    2000,
    50.00,
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '4 days'
);

-- Insert sample draws for testing
INSERT INTO draws (title, description, draw_at, ticket_price, status) VALUES
(
    'Welcome Lucky Draw',
    'Join our welcome draw and win exciting prizes! This is a free draw for all new members.',
    NOW() + INTERVAL '7 days',
    0,
    'upcoming'
),
(
    'Monthly Premium Draw',
    'Monthly premium draw with amazing rewards. Entry fee applies.',
    NOW() + INTERVAL '30 days',
    100,
    'upcoming'
),
(
    'Community Celebration Draw',
    'Celebrating our growing community with special prizes for everyone!',
    NOW() + INTERVAL '14 days',
    50,
    'upcoming'
);

-- Insert sample feature access configurations
-- Note: These will be automatically created for new users via the trigger
-- This is just for reference of available features

-- Sample admin user setup (you'll need to update this with your actual email after signup)
-- UPDATE profiles SET is_admin = true, role = 'admin' WHERE email = 'your-admin-email@example.com';

-- Sample feature access for premium features
-- INSERT INTO feature_access (user_id, feature_name, has_access, expires_at) 
-- SELECT id, 'campaigns', true, NOW() + INTERVAL '1 year' FROM profiles WHERE email = 'your-email@example.com';

-- Sample notification types for reference
-- These will be created automatically by the application
-- 'like' - Someone liked your post
-- 'comment' - Someone commented on your post
-- 'follow' - Someone followed you
-- 'donation' - Someone donated to your campaign
-- 'draw_winner' - You won a lucky draw
-- 'session_request' - Someone requested a Sahaya session
-- 'system' - System notifications

-- Create a function to set up admin user (run this after creating your first user)
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Check if user exists and get their ID
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = admin_email), id 
    INTO user_exists, user_id
    FROM profiles 
    WHERE email = admin_email;
    
    IF user_exists THEN
        -- Update user to admin
        UPDATE profiles 
        SET 
            is_admin = true,
            role = 'admin',
            is_verified = true,
            updated_at = NOW()
        WHERE email = admin_email;
        
        -- Grant all feature access to admin
        INSERT INTO feature_access (user_id, feature_name, has_access, granted_at)
        SELECT 
            user_id,
            feature_name,
            true,
            NOW()
        FROM (
            VALUES 
                ('posts'),
                ('comments'),
                ('messaging'),
                ('campaigns'),
                ('draws'),
                ('reels'),
                ('sahaya'),
                ('analytics'),
                ('admin_panel')
        ) AS features(feature_name)
        ON CONFLICT (user_id, feature_name) 
        DO UPDATE SET 
            has_access = true,
            granted_at = NOW();
        
        -- Log the admin setup
        INSERT INTO analytics_events (user_id, event_type, event_data)
        VALUES (
            user_id,
            'admin_setup',
            jsonb_build_object(
                'admin_email', admin_email,
                'setup_at', NOW()
            )
        );
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION setup_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION search_content(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed(UUID, INTEGER, INTEGER) TO authenticated;

-- Insert initial analytics event types for reference
INSERT INTO analytics_events (event_type, event_data) VALUES
('app_install', '{"platform": "web", "version": "1.0.0"}'),
('user_signup', '{"method": "email", "source": "organic"}'),
('admin_setup', '{"setup_method": "manual"}');

-- Insert sample feature access templates
INSERT INTO feature_access (user_id, feature_name, has_access) 
SELECT 
    id,
    'campaigns',
    true
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, feature_name) DO UPDATE SET has_access = true;

INSERT INTO feature_access (user_id, feature_name, has_access) 
SELECT 
    id,
    'draws',
    true
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, feature_name) DO UPDATE SET has_access = true;

INSERT INTO feature_access (user_id, feature_name, has_access) 
SELECT 
    id,
    'reels',
    true
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, feature_name) DO UPDATE SET has_access = true;

INSERT INTO feature_access (user_id, feature_name, has_access) 
SELECT 
    id,
    'sahaya',
    true
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, feature_name) DO UPDATE SET has_access = true;

INSERT INTO feature_access (user_id, feature_name, has_access) 
SELECT 
    id,
    'analytics',
    true
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, feature_name) DO UPDATE SET has_access = true;

INSERT INTO feature_access (user_id, feature_name, has_access) 
SELECT 
    id,
    'admin_panel',
    true
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, feature_name) DO UPDATE SET has_access = true;
