-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE USING (auth.uid() = id);

-- Add feature_access table policies (if not exists)
CREATE TABLE IF NOT EXISTS feature_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  can_feed BOOLEAN DEFAULT true,
  can_reels BOOLEAN DEFAULT false,
  can_messaging BOOLEAN DEFAULT false,
  can_fundraising BOOLEAN DEFAULT false,
  can_emotional BOOLEAN DEFAULT false,
  can_luckydraw BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feature_access
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive policies for feature_access
CREATE POLICY "feature_access_select_policy" ON feature_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feature_access_insert_policy" ON feature_access FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feature_access_update_policy" ON feature_access FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "feature_access_delete_policy" ON feature_access FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access(user_id);
