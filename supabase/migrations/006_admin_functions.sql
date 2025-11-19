-- Enhanced admin setup function with better error handling
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

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION setup_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION search_content(TEXT, TEXT, INTEGER) TO authenticated;
