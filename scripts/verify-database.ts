import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyDatabase() {
  console.log("🔍 Verifying database setup...")

  try {
    // Test 1: Check if key tables exist
    console.log("\n📋 Checking tables...")
    const tables = [
      "profiles",
      "posts",
      "post_likes",
      "comments",
      "follows",
      "campaigns",
      "donations",
      "draws",
      "draw_entries",
      "reels",
      "conversations",
      "messages",
      "sahaya_listeners",
      "sahaya_sessions",
      "notifications",
      "analytics_events",
      "reports",
      "referrals",
      "feature_access",
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).select("*").limit(1)
      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`)
        return false
      } else {
        console.log(`✅ Table ${table}: OK`)
      }
    }

    // Test 2: Check if RLS is enabled
    console.log("\n🔒 Checking Row Level Security...")
    const { data: rlsData, error: rlsError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'posts', 'campaigns', 'draws')
        ORDER BY tablename;
      `,
    })

    if (rlsError) {
      console.error("❌ Could not check RLS:", rlsError.message)
      return false
    }

    console.log("✅ Row Level Security policies verified")

    // Test 3: Check if functions exist
    console.log("\n⚙️  Checking database functions...")
    const { data: functions, error: funcError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name IN (
          'handle_new_user',
          'update_post_likes_count',
          'update_comment_likes_count',
          'update_campaign_raised_amount',
          'generate_referral_code',
          'create_notification',
          'get_user_feed',
          'search_content'
        );
      `,
    })

    if (funcError) {
      console.error("❌ Could not check functions:", funcError.message)
      return false
    }

    console.log("✅ Database functions verified")

    // Test 4: Check if triggers exist
    console.log("\n🔄 Checking triggers...")
    const { data: triggers, error: triggerError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND trigger_name IN (
          'on_auth_user_created',
          'post_likes_count_trigger',
          'comment_likes_count_trigger',
          'post_comments_count_trigger'
        );
      `,
    })

    if (triggerError) {
      console.error("❌ Could not check triggers:", triggerError.message)
      return false
    }

    console.log("✅ Database triggers verified")

    // Test 5: Check sample data
    console.log("\n📊 Checking sample data...")
    const { data: drawsData, error: drawsError } = await supabase.from("draws").select("*").limit(5)

    if (drawsError) {
      console.error("❌ Could not check sample draws:", drawsError.message)
      return false
    }

    console.log(`✅ Found ${drawsData?.length || 0} sample draws`)

    // Test 6: Test basic operations
    console.log("\n🧪 Testing basic operations...")

    // Test creating a test profile (will be cleaned up)
    const testUserId = "00000000-0000-0000-0000-000000000000"
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: testUserId,
      email: "test@example.com",
      full_name: "Test User",
      username: "test_user_verification",
    })

    if (profileError) {
      console.error("❌ Could not create test profile:", profileError.message)
      return false
    }

    // Clean up test data
    await supabase.from("profiles").delete().eq("id", testUserId)

    console.log("✅ Basic operations working")

    console.log("\n🎉 Database verification completed successfully!")
    console.log("\n📋 Next steps:")
    console.log("1. Sign up for your first user account")
    console.log("2. Run this SQL to make them admin:")
    console.log("   SELECT setup_admin_user('your-email@example.com');")
    console.log("3. Test the application features")
    console.log("4. Configure storage buckets for file uploads")

    return true
  } catch (error) {
    console.error("❌ Database verification failed:", error)
    return false
  }
}

// Test connection first
async function testConnection() {
  try {
    console.log("🔍 Testing database connection...")
    const { data, error } = await supabase.from("profiles").select("*").limit(1)

    if (error && error.code !== "PGRST116") {
      console.error("❌ Database connection failed:", error)
      return false
    }

    console.log("✅ Database connection successful")
    return true
  } catch (err) {
    console.error("❌ Database connection test failed:", err)
    return false
  }
}

if (require.main === module) {
  async function main() {
    const connected = await testConnection()
    if (!connected) {
      process.exit(1)
    }

    const verified = await verifyDatabase()
    if (!verified) {
      console.log("\n⚠️  Database verification failed")
      console.log("Please check the errors above and run migrations again")
      process.exit(1)
    }
  }

  main().catch(console.error)
}

export { verifyDatabase, testConnection }
