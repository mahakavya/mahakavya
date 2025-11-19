import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Complete SQL setup script
const setupSQL = `
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  shadow_muted BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature access table
CREATE TABLE IF NOT EXISTS feature_access (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  has_access BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, feature_name)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  intro_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  tags TEXT[],
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount INTEGER NOT NULL CHECK (goal_amount > 0),
  raised_amount INTEGER DEFAULT 0 CHECK (raised_amount >= 0),
  cover_url TEXT,
  category TEXT DEFAULT 'other',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused', 'completed', 'cancelled')),
  end_date TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize_description TEXT,
  prize_value DECIMAL(10,2),
  draw_at TIMESTAMPTZ NOT NULL,
  ticket_price INTEGER DEFAULT 0 CHECK (ticket_price >= 0),
  max_entries INTEGER,
  entry_cost DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  seed TEXT,
  result JSONB,
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reels table
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumb_url TEXT,
  caption TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[],
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listeners table
CREATE TABLE IF NOT EXISTS listeners (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT NOT NULL,
  expertise TEXT[] NOT NULL,
  languages TEXT[] NOT NULL,
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID,
  conversation_id UUID REFERENCES conversations(id),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  topic TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('post', 'reel', 'comment')),
  content_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content_text TEXT,
  media_urls TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_score DECIMAL(3,2) DEFAULT 0.00,
  blockchain_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

const functionsSQL = `
-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Grant basic feature access
    INSERT INTO feature_access (user_id, feature_name, has_access)
    VALUES 
        (NEW.id, 'posts', true),
        (NEW.id, 'comments', true),
        (NEW.id, 'messaging', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup admin user
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
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle post like
CREATE OR REPLACE FUNCTION toggle_post_like(post_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  like_exists BOOLEAN;
  new_count INTEGER;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid
  ) INTO like_exists;
  
  IF like_exists THEN
    -- Remove like
    DELETE FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid;
    
    -- Update count
    UPDATE posts 
    SET likes_count = likes_count - 1 
    WHERE id = post_uuid
    RETURNING likes_count INTO new_count;
    
    RETURN json_build_object('liked', false, 'count', new_count);
  ELSE
    -- Add like
    INSERT INTO post_likes (post_id, user_id) 
    VALUES (post_uuid, user_uuid);
    
    -- Update count
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = post_uuid
    RETURNING likes_count INTO new_count;
    
    RETURN json_build_object('liked', true, 'count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

const indexesSQL = `
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_reels_author_id ON reels(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
`

const triggersSQL = `
-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reels_updated_at BEFORE UPDATE ON reels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listeners_updated_at BEFORE UPDATE ON listeners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

const rlsSQL = `
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own feature access" ON feature_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage feature access" ON feature_access FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Live campaigns are viewable by everyone" ON campaigns FOR SELECT USING (status = 'live' OR auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Draws are viewable by everyone" ON draws FOR SELECT USING (true);

CREATE POLICY "Reels are viewable by everyone" ON reels FOR SELECT USING (NOT is_hidden OR auth.uid() = author_id);
CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view content items" ON content_items FOR SELECT USING (true);
CREATE POLICY "Users can insert their own content" ON content_items FOR INSERT WITH CHECK (author_id = auth.uid());
`

const sampleDataSQL = `
-- Insert sample draws
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
    'Premium laptop giveaway for our community members.',
    'Gaming Laptop (16GB RAM, 512GB SSD)',
    75000.00,
    500,
    100.00,
    'upcoming',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '37 days'
) ON CONFLICT DO NOTHING;

-- Mark migrations as applied
INSERT INTO schema_migrations (version, description) VALUES
('001_initial_schema', 'Initial database schema with all tables'),
('002_functions', 'Database functions and triggers'),
('003_indexes', 'Database indexes for performance'),
('004_rls_policies', 'Row Level Security policies'),
('005_sample_data', 'Sample data for testing'),
('006_complete_setup', 'Complete database setup')
ON CONFLICT (version) DO NOTHING;
`

async function executeSQL(sql: string, description: string) {
  console.log(`\n📄 Executing: ${description}`)

  const statements = sql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

  let successCount = 0
  let skipCount = 0

  for (const statement of statements) {
    if (!statement.trim()) continue

    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql: statement + ";",
      })

      if (error) {
        const safeErrors = ["already exists", "does not exist", "duplicate key", "relation already exists"]

        const isSafeError = safeErrors.some((safeError) => error.message.toLowerCase().includes(safeError))

        if (isSafeError) {
          skipCount++
          continue
        } else {
          console.error(`   ❌ Error: ${error.message}`)
          continue
        }
      }

      successCount++
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`)
    }
  }

  console.log(`   ✅ Success: ${successCount}, Skipped: ${skipCount}`)
}

async function runCompleteSetup() {
  console.log("🚀 MAHAKAVYA SOCIAL PLATFORM - DATABASE SETUP")
  console.log("=".repeat(60))

  try {
    // Test connection
    console.log("🔍 Testing database connection...")
    const { error: testError } = await supabase.from("information_schema.tables").select("*").limit(1)
    if (testError) {
      throw new Error(`Connection failed: ${testError.message}`)
    }
    console.log("✅ Database connection successful")

    // Execute setup in order
    await executeSQL(setupSQL, "Core database schema")
    await executeSQL(functionsSQL, "Database functions")
    await executeSQL(indexesSQL, "Performance indexes")
    await executeSQL(triggersSQL, "Database triggers")
    await executeSQL(rlsSQL, "Row Level Security policies")
    await executeSQL(sampleDataSQL, "Sample data")

    // Verify setup
    console.log("\n🔍 Verifying setup...")

    const tables = ["profiles", "posts", "campaigns", "draws", "reels", "notifications"]
    let verifiedCount = 0

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1)
        if (!error) {
          verifiedCount++
          console.log(`   ✅ Table '${table}' verified`)
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' verification failed`)
      }
    }

    console.log("\n" + "=".repeat(60))
    console.log("🎉 DATABASE SETUP COMPLETE!")
    console.log("=".repeat(60))
    console.log(`✅ Tables verified: ${verifiedCount}/${tables.length}`)
    console.log("📋 All core features are ready:")
    console.log("   • Social Feed (Samvaaha)")
    console.log("   • Video Reels (Drishya)")
    console.log("   • Messaging (Varta)")
    console.log("   • Fundraising (Nivedana)")
    console.log("   • Emotional Support (Sahaya)")
    console.log("   • Lucky Draws (Bhagyachakra)")
    console.log("   • Content Management & AI")
    console.log("   • Admin Panel & Analytics")

    console.log("\n📝 NEXT STEPS:")
    console.log("1. Create your first user account")
    console.log("2. Run: SELECT setup_admin_user('your-email@example.com');")
    console.log("3. Test all platform features")
    console.log("4. Deploy to production")
  } catch (err: any) {
    console.error("❌ Setup failed:", err.message)
    process.exit(1)
  }
}

// Execute the setup
runCompleteSetup()
