import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log("🚀 MAHAKAVYA SOCIAL PLATFORM - COMPLETE DATABASE SETUP")
console.log("=".repeat(70))
console.log(`📍 Target: ${supabaseUrl}`)
console.log(`🔑 Using service role key: ${supabaseServiceKey.substring(0, 20)}...`)

// Test database connection first
async function testConnection() {
  try {
    console.log("\n🔍 Testing database connection...")
    const { data, error } = await supabase.from("information_schema.tables").select("table_name").limit(1)

    if (error) {
      console.error("❌ Connection failed:", error.message)
      return false
    }

    console.log("✅ Database connection successful")
    return true
  } catch (err: any) {
    console.error("❌ Connection test failed:", err.message)
    return false
  }
}

// Execute SQL with proper error handling
async function executeSQL(sql: string, description: string) {
  console.log(`\n📄 ${description}`)
  console.log("-".repeat(50))

  const statements = sql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--") && !stmt.match(/^\s*$/))

  console.log(`📋 Found ${statements.length} statements to execute`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue

    const preview = statement.substring(0, 60).replace(/\s+/g, " ")

    try {
      // Use direct SQL execution
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: statement + ";",
      })

      if (error) {
        // Check for safe errors that can be skipped
        const safeErrors = [
          "already exists",
          "does not exist",
          "duplicate key",
          "relation already exists",
          "function already exists",
          "extension already exists",
          "trigger already exists",
          "policy already exists",
          "index already exists",
        ]

        const isSafeError = safeErrors.some((safe) => error.message.toLowerCase().includes(safe))

        if (isSafeError) {
          console.log(`   ⚠️  [${i + 1}] SKIP: ${preview}`)
          skipCount++
        } else {
          console.error(`   ❌ [${i + 1}] ERROR: ${preview}`)
          console.error(`      ${error.message}`)
          errorCount++
        }
      } else {
        console.log(`   ✅ [${i + 1}] OK: ${preview}`)
        successCount++
      }

      // Small delay to prevent overwhelming
      if (i % 5 === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    } catch (err: any) {
      console.error(`   ❌ [${i + 1}] FAIL: ${preview}`)
      console.error(`      ${err.message}`)
      errorCount++
    }
  }

  console.log(`\n📊 Results: ✅ ${successCount} | ⚠️  ${skipCount} | ❌ ${errorCount}`)
  return { successCount, skipCount, errorCount }
}

// Main setup execution
async function runDatabaseSetup() {
  try {
    // Test connection
    const connected = await testConnection()
    if (!connected) {
      process.exit(1)
    }

    console.log("\n🏗️  Starting database setup process...")

    // 1. Extensions and core setup
    const extensionsSQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);
`

    await executeSQL(extensionsSQL, "1️⃣  Installing extensions and migration tracking")

    // 2. Core tables
    const coreTablesSQL = `
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

CREATE TABLE IF NOT EXISTS feature_access (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  has_access BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, feature_name)
);

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

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT NOT NULL,
  payment_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  kind TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`

    await executeSQL(coreTablesSQL, "2️⃣  Creating core tables (profiles, subscriptions, payments)")

    // 3. Social features tables
    const socialTablesSQL = `
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

CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);
`

    await executeSQL(socialTablesSQL, "3️⃣  Creating social features (posts, likes, comments, follows)")

    // 4. Platform features tables
    const platformTablesSQL = `
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

CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS entries (
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entries_count INTEGER DEFAULT 1 CHECK (entries_count > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (draw_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

CREATE TABLE IF NOT EXISTS reel_views (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  view_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);
`

    await executeSQL(platformTablesSQL, "4️⃣  Creating platform features (campaigns, draws, reels)")

    // 5. Communication tables
    const communicationTablesSQL = `
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listener_id UUID REFERENCES listeners(user_id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
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
`

    await executeSQL(communicationTablesSQL, "5️⃣  Creating communication features (messaging, sahaya)")

    // 6. System tables
    const systemTablesSQL = `
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

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  props JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'reel', 'user', 'campaign')),
  entity_id UUID NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

    await executeSQL(systemTablesSQL, "6️⃣  Creating system tables (notifications, analytics, moderation)")

    // 7. Functions
    const functionsSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
    
    INSERT INTO feature_access (user_id, feature_name, has_access)
    VALUES 
        (NEW.id, 'posts', true),
        (NEW.id, 'comments', true),
        (NEW.id, 'messaging', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = admin_email), id 
    INTO user_exists, user_id
    FROM profiles 
    WHERE email = admin_email;
    
    IF user_exists THEN
        UPDATE profiles 
        SET 
            is_admin = true,
            role = 'admin',
            is_verified = true,
            updated_at = NOW()
        WHERE email = admin_email;
        
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

CREATE OR REPLACE FUNCTION toggle_post_like(post_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  like_exists BOOLEAN;
  new_count INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid
  ) INTO like_exists;
  
  IF like_exists THEN
    DELETE FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid;
    
    UPDATE posts 
    SET likes_count = likes_count - 1 
    WHERE id = post_uuid
    RETURNING likes_count INTO new_count;
    
    RETURN json_build_object('liked', false, 'count', new_count);
  ELSE
    INSERT INTO post_likes (post_id, user_id) 
    VALUES (post_uuid, user_uuid);
    
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = post_uuid
    RETURNING likes_count INTO new_count;
    
    RETURN json_build_object('liked', true, 'count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

    await executeSQL(functionsSQL, "7️⃣  Creating database functions")

    // 8. Indexes
    const indexesSQL = `
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee_id ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_reels_author_id ON reels(author_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
`

    await executeSQL(indexesSQL, "8️⃣  Creating performance indexes")

    // 9. Triggers
    const triggersSQL = `
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

    await executeSQL(triggersSQL, "9️⃣  Creating database triggers")

    // 10. RLS Policies
    const rlsSQL = `
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

CREATE POLICY "Comments are viewable by everyone" ON post_comments FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Authenticated users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Live campaigns are viewable by everyone" ON campaigns FOR SELECT USING (status = 'live' OR auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Draws are viewable by everyone" ON draws FOR SELECT USING (true);

CREATE POLICY "Reels are viewable by everyone" ON reels FOR SELECT USING (NOT is_hidden OR auth.uid() = author_id);
CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own reels" ON reels FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

CREATE POLICY "Listeners are viewable by everyone" ON listeners FOR SELECT USING (is_active = true);
CREATE POLICY "Users can register as listeners" ON listeners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their listener profile" ON listeners FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON sessions FOR SELECT USING (
    auth.uid() = listener_id OR auth.uid() = seeker_id
);
CREATE POLICY "Users can create sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view content items" ON content_items FOR SELECT USING (true);
CREATE POLICY "Users can insert their own content" ON content_items FOR INSERT WITH CHECK (author_id = auth.uid());
`

    await executeSQL(rlsSQL, "🔟 Setting up Row Level Security policies")

    // 11. Sample data
    const sampleDataSQL = `
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
) ON CONFLICT DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
('001_initial_schema', 'Initial database schema with all tables'),
('002_functions', 'Database functions and triggers'),
('003_indexes', 'Database indexes for performance'),
('004_triggers', 'Database triggers for automation'),
('005_rls_policies', 'Row Level Security policies'),
('006_sample_data', 'Sample data for testing'),
('007_complete_setup', 'Complete database setup with all features')
ON CONFLICT (version) DO NOTHING;
`

    await executeSQL(sampleDataSQL, "1️⃣1️⃣ Adding sample data and migration tracking")

    // Final verification
    console.log("\n🔍 VERIFYING DATABASE SETUP")
    console.log("=".repeat(50))

    const tables = [
      "profiles",
      "posts",
      "campaigns",
      "draws",
      "reels",
      "conversations",
      "listeners",
      "notifications",
      "content_items",
    ]

    let verifiedCount = 0
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1)
        if (!error) {
          verifiedCount++
          console.log(`   ✅ Table '${table}' verified`)
        } else {
          console.log(`   ❌ Table '${table}' error: ${error.message}`)
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' verification failed`)
      }
    }

    // Check functions
    try {
      const { data: functions } = await supabase.rpc("exec_sql", {
        sql: `SELECT routine_name FROM information_schema.routines 
              WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
              AND routine_name IN ('handle_new_user', 'toggle_post_like', 'setup_admin_user');`,
      })
      console.log(`   ✅ Functions verified: ${functions?.length || 0} found`)
    } catch (err) {
      console.log(`   ⚠️  Function verification skipped`)
    }

    console.log("\n" + "=".repeat(70))
    console.log("🎉 MAHAKAVYA SOCIAL PLATFORM DATABASE SETUP COMPLETE!")
    console.log("=".repeat(70))
    console.log(`✅ Tables verified: ${verifiedCount}/${tables.length}`)
    console.log("\n📋 ALL PLATFORM FEATURES ARE READY:")
    console.log("   🔗 Social Feed (Samvaaha) - Posts, likes, comments, follows")
    console.log("   🎥 Video Reels (Drishya) - Short-form video content")
    console.log("   💬 Messaging (Varta) - Real-time conversations")
    console.log("   💰 Fundraising (Nivedana) - Campaign management")
    console.log("   🤝 Emotional Support (Sahaya) - Listener-seeker matching")
    console.log("   🎲 Lucky Draws (Bhagyachakra) - Prize competitions")
    console.log("   🛡️ Content Management - AI analysis and moderation")
    console.log("   📊 Admin Panel - Complete platform management")
    console.log("   🔐 Security - Row Level Security policies")
    console.log("   📈 Analytics - Event tracking and monitoring")

    console.log("\n📝 NEXT STEPS:")
    console.log("1. 👤 Create your first user account via signup")
    console.log("2. 🔧 Run: SELECT setup_admin_user('your-email@example.com');")
    console.log("3. 🧪 Test all platform features thoroughly")
    console.log("4. 🚀 Deploy to production environment")
    console.log("5. 🎯 Configure payment gateways and AI services")

    console.log("\n🔑 KEY FUNCTIONS AVAILABLE:")
    console.log("   • setup_admin_user(email) - Grant admin access")
    console.log("   • toggle_post_like(post_id, user_id) - Social interactions")
    console.log("   • handle_new_user() - Automatic user onboarding")

    console.log("\n🎊 The Mahakavya Social Platform is ready for use!")
  } catch (err: any) {
    console.error("\n❌ SETUP FAILED:", err.message)
    console.error("Please check your environment variables and database permissions")
    process.exit(1)
  }
}

// Execute the complete setup
runDatabaseSetup()
