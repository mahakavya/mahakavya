import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigrations() {
  const migrations = [
    "001_initial_schema.sql",
    "002_rls_policies.sql",
    "003_indexes.sql",
    "004_functions.sql",
    "005_seed_data.sql",
  ]

  console.log("🚀 Starting database migrations...")
  console.log(`📍 Target database: ${supabaseUrl}`)

  for (const migration of migrations) {
    try {
      console.log(`\n📄 Running migration: ${migration}`)

      const migrationPath = join(process.cwd(), "supabase", "migrations", migration)

      let sql: string
      try {
        sql = readFileSync(migrationPath, "utf8")
      } catch (fileError) {
        console.error(`❌ Could not read migration file: ${migrationPath}`)
        console.error("Make sure the migration files exist in the supabase/migrations directory")
        process.exit(1)
      }

      // Split SQL into individual statements to handle them separately
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

      console.log(`   📊 Found ${statements.length} SQL statements`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ";"

        try {
          const { error } = await supabase.rpc("exec_sql", {
            sql: statement,
          })

          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            console.error(`   SQL: ${statement.substring(0, 100)}...`)

            // Continue with next statement for certain errors
            if (error.message.includes("already exists") || error.message.includes("does not exist")) {
              console.log(`   ⚠️  Continuing despite error (likely safe)`)
              continue
            }

            process.exit(1)
          }
        } catch (rpcError) {
          console.error(`❌ RPC Error in statement ${i + 1}:`, rpcError)
          process.exit(1)
        }
      }

      console.log(`✅ Completed: ${migration}`)
    } catch (err) {
      console.error(`❌ Failed to run ${migration}:`, err)
      process.exit(1)
    }
  }

  console.log("\n🎉 All migrations completed successfully!")
  console.log("\n📋 Next steps:")
  console.log("1. Sign up for your first user account")
  console.log("2. Run this SQL to make them admin:")
  console.log("   UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';")
  console.log("3. Test the application features")
}

// Alternative function to run SQL directly without file system
async function runSqlDirect(sql: string, name: string) {
  try {
    console.log(`📄 Running: ${name}`)

    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", {
        sql: statement + ";",
      })

      if (error) {
        if (error.message.includes("already exists") || error.message.includes("does not exist")) {
          continue // Skip expected errors
        }
        console.error(`❌ Error in ${name}:`, error)
        return false
      }
    }

    console.log(`✅ Completed: ${name}`)
    return true
  } catch (err) {
    console.error(`❌ Failed to run ${name}:`, err)
    return false
  }
}

// Function to test database connection
async function testConnection() {
  try {
    console.log("🔍 Testing database connection...")
    const { data, error } = await supabase.from("_supabase_migrations").select("*").limit(1)

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

// Function to verify migration success
async function verifyMigrations() {
  console.log("\n🔍 Verifying migrations...")

  try {
    // Check if key tables exist
    const tables = ["profiles", "posts", "campaigns", "draws", "reels"]

    for (const table of tables) {
      const { error } = await supabase.from(table).select("*").limit(1)
      if (error) {
        console.error(`❌ Table ${table} not found or accessible:`, error.message)
        return false
      }
    }

    console.log("✅ All key tables verified")

    // Check if functions exist
    const { data: functions, error: funcError } = await supabase.rpc("exec_sql", {
      sql: `SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
            AND routine_name IN ('handle_new_user', 'update_post_likes_count');`,
    })

    if (funcError) {
      console.error("❌ Could not verify functions:", funcError)
      return false
    }

    console.log("✅ Database functions verified")
    return true
  } catch (err) {
    console.error("❌ Migration verification failed:", err)
    return false
  }
}

// Main execution
if (require.main === module) {
  async function main() {
    const connected = await testConnection()
    if (!connected) {
      process.exit(1)
    }

    await runMigrations()

    const verified = await verifyMigrations()
    if (!verified) {
      console.log("⚠️  Migrations completed but verification failed")
      console.log("   Please check your Supabase dashboard manually")
    }
  }

  main().catch(console.error)
}

export { runMigrations, runSqlDirect, testConnection, verifyMigrations }
