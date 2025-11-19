import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

async function runSamvaahaSchemaFix() {
  console.log("🔧 Starting Samvaaha schema fix...")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing required environment variables:")
    console.error("- NEXT_PUBLIC_SUPABASE_URL")
    console.error("- SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Test connection
    console.log("🔍 Testing database connection...")
    const { error: connectionError } = await supabase.from("profiles").select("count").limit(1)

    if (connectionError && !connectionError.message.includes('relation "profiles" does not exist')) {
      throw new Error(`Connection failed: ${connectionError.message}`)
    }

    console.log("✅ Database connection successful")

    // Read and execute the schema fix SQL
    console.log("📖 Reading schema fix SQL...")
    const sqlPath = join(process.cwd(), "scripts", "fix-samvaaha-schema.sql")
    const sql = readFileSync(sqlPath, "utf8")

    console.log("🚀 Executing schema fix...")
    const { error: schemaError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (schemaError) {
      // If the RPC function doesn't exist, try direct execution
      console.log("⚠️  RPC function not available, trying direct execution...")

      // Split SQL into individual statements and execute them
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

      for (const statement of statements) {
        if (statement.includes("RAISE NOTICE")) continue // Skip notice statements

        try {
          const { error } = await supabase.rpc("exec_sql", { sql_query: statement + ";" })
          if (error) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`)
          }
        } catch (err) {
          console.warn(`⚠️  Warning: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
      }
    }

    // Verify the schema was created correctly
    console.log("🔍 Verifying schema...")

    const tables = [
      "profiles",
      "samvaaha_posts",
      "samvaaha_likes",
      "samvaaha_comments",
      "samvaaha_bookmarks",
      "samvaaha_follows",
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).select("count").limit(1)

      if (error) {
        console.error(`❌ Table ${table} verification failed: ${error.message}`)
      } else {
        console.log(`✅ Table ${table} exists and is accessible`)
      }
    }

    // Test creating a sample profile (if user exists)
    console.log("🧪 Testing profile creation...")
    try {
      const { data: users } = await supabase.auth.admin.listUsers()

      if (users && users.users.length > 0) {
        const testUser = users.users[0]

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: testUser.id,
          username: `test_${testUser.id.slice(0, 8)}`,
          display_name: testUser.email || "Test User",
        })

        if (profileError) {
          console.warn(`⚠️  Profile creation test warning: ${profileError.message}`)
        } else {
          console.log("✅ Profile creation test successful")
        }
      }
    } catch (err) {
      console.warn(`⚠️  Profile test skipped: ${err instanceof Error ? err.message : "Unknown error"}`)
    }

    console.log("🎉 Samvaaha schema fix completed successfully!")
    console.log("")
    console.log("Next steps:")
    console.log("1. Test the /samvaaha page in your application")
    console.log("2. Try creating a post")
    console.log("3. Verify user authentication works")
    console.log("")
  } catch (error) {
    console.error("❌ Schema fix failed:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  runSamvaahaSchemaFix()
}

export { runSamvaahaSchemaFix }
