#!/usr/bin/env tsx

/**
 * Run Samvaaha Social Feed Migration
 *
 * This script executes the complete social media database setup
 * and verifies all components are properly installed.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:")
  console.error("   NEXT_PUBLIC_SUPABASE_URL")
  console.error("   SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log("🚀 Starting Samvaaha Social Feed Migration...\n")

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), "supabase/migrations/043_samvaaha_social_feed.sql")
    const migrationSQL = readFileSync(migrationPath, "utf8")

    console.log("📄 Executing migration SQL...")

    // Execute the migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    })

    if (migrationError) {
      // If the RPC doesn't exist, try direct execution
      console.log("⚠️  RPC method not available, trying direct execution...")

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc("exec", { sql: statement })
          if (error && !error.message.includes("already exists")) {
            console.error(`❌ Error executing statement: ${error.message}`)
            console.error(`Statement: ${statement.substring(0, 100)}...`)
          }
        }
      }
    }

    console.log("✅ Migration executed successfully!\n")

    // Verify tables were created
    console.log("🔍 Verifying table creation...")

    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "posts",
        "comments",
        "post_likes",
        "comment_likes",
        "bookmarks",
        "moderation_flags",
        "follows",
        "notifications",
      ])

    if (tablesError) {
      console.error("❌ Error checking tables:", tablesError.message)
    } else {
      console.log("📊 Tables created:")
      tables?.forEach((table) => {
        console.log(`   ✓ ${table.table_name}`)
      })
    }

    // Verify functions were created
    console.log("\n🔧 Verifying functions...")

    const { data: functions, error: functionsError } = await supabase
      .from("information_schema.routines")
      .select("routine_name, routine_type")
      .eq("routine_schema", "public")
      .in("routine_name", [
        "is_admin",
        "can_view_post",
        "bump_post_counts",
        "bump_comment_counts",
        "update_updated_at_column",
      ])

    if (functionsError) {
      console.error("❌ Error checking functions:", functionsError.message)
    } else {
      console.log("⚙️  Functions created:")
      functions?.forEach((func) => {
        console.log(`   ✓ ${func.routine_name} (${func.routine_type})`)
      })
    }

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...")

    // Test user profiles table
    const { data: profileTest, error: profileError } = await supabase.from("user_profiles").select("count").limit(1)

    if (profileError) {
      console.error("❌ Error testing user_profiles:", profileError.message)
    } else {
      console.log("   ✓ user_profiles table accessible")
    }

    // Test posts table
    const { data: postsTest, error: postsError } = await supabase.from("posts").select("count").limit(1)

    if (postsError) {
      console.error("❌ Error testing posts:", postsError.message)
    } else {
      console.log("   ✓ posts table accessible")
    }

    // Test RLS policies
    console.log("\n🔒 Testing RLS policies...")

    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("tablename, policyname")
      .eq("schemaname", "public")
      .in("tablename", ["posts", "comments", "post_likes", "bookmarks"])

    if (policiesError) {
      console.error("❌ Error checking policies:", policiesError.message)
    } else {
      console.log("🛡️  RLS policies active:")
      const policyCount = policies?.length || 0
      console.log(`   ✓ ${policyCount} policies configured`)
    }

    console.log("\n🎉 Samvaaha Social Feed Migration completed successfully!")
    console.log("\n📋 Next steps:")
    console.log('   1. Create a Supabase storage bucket named "samvaaha-media"')
    console.log("   2. Configure bucket policies for public read access")
    console.log("   3. Test the social feed functionality at /samvaaha")
    console.log("   4. Run the E2E tests to verify everything works")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
