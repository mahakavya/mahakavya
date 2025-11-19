import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

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

async function runDatabaseSetup() {
  console.log("🚀 Starting complete database setup...")
  console.log(`📍 Target database: ${supabaseUrl}`)

  try {
    // Read the complete SQL file
    const sqlPath = join(process.cwd(), "database-complete.sql")
    console.log(`📄 Reading SQL file: ${sqlPath}`)

    const sql = readFileSync(sqlPath, "utf8")
    console.log(`📊 SQL file size: ${(sql.length / 1024).toFixed(2)} KB`)

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 &&
          !stmt.startsWith("--") &&
          !stmt.match(/^\s*$/) &&
          !stmt.startsWith("/*") &&
          !stmt.includes("RAISE NOTICE"),
      )

    console.log(`📋 Found ${statements.length} SQL statements to execute`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (!statement) continue

      const statementPreview = statement.substring(0, 80).replace(/\s+/g, " ")

      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing: ${statementPreview}...`)

        // Execute the statement
        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        })

        if (error) {
          // Check if it's a safe error to skip
          const safeErrors = [
            "already exists",
            "does not exist",
            "duplicate key",
            "relation already exists",
            "function already exists",
            "type already exists",
            "extension already exists",
            "trigger already exists",
            "policy already exists",
            "index already exists",
          ]

          const isSafeError = safeErrors.some((safeError) => error.message.toLowerCase().includes(safeError))

          if (isSafeError) {
            console.log(`   ⚠️  Skipped (already exists): ${error.message.substring(0, 100)}`)
            skipCount++
            continue
          } else {
            console.error(`   ❌ Error: ${error.message}`)
            errorCount++

            // Continue with non-critical errors
            if (!error.message.includes("permission denied") && !error.message.includes("syntax error")) {
              continue
            } else {
              throw error
            }
          }
        }

        successCount++
        console.log(`   ✅ Success`)

        // Add small delay to prevent overwhelming the database
        if (i % 10 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (err: any) {
        console.error(`   ❌ Failed to execute statement ${i + 1}:`, err.message)
        errorCount++

        // Stop on critical errors
        if (
          err.message.includes("permission denied") ||
          err.message.includes("connection") ||
          err.message.includes("authentication")
        ) {
          throw err
        }
      }
    }

    console.log("\n" + "=".repeat(60))
    console.log("📊 EXECUTION SUMMARY")
    console.log("=".repeat(60))
    console.log(`✅ Successful: ${successCount}`)
    console.log(`⚠️  Skipped: ${skipCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📋 Total: ${statements.length}`)

    if (errorCount === 0) {
      console.log("\n🎉 Database setup completed successfully!")
    } else if (errorCount < 5) {
      console.log("\n⚠️  Database setup completed with minor issues")
    } else {
      console.log("\n❌ Database setup completed with significant errors")
    }

    // Verify the setup
    await verifySetup()
  } catch (err: any) {
    console.error("❌ Database setup failed:", err.message)
    process.exit(1)
  }
}

async function verifySetup() {
  console.log("\n🔍 Verifying database setup...")

  try {
    // Check if key tables exist
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

    let verifiedTables = 0
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1)
        if (!error) {
          verifiedTables++
          console.log(`   ✅ Table '${table}' verified`)
        } else {
          console.log(`   ❌ Table '${table}' not accessible: ${error.message}`)
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' verification failed`)
      }
    }

    // Check if functions exist
    const { data: functions, error: funcError } = await supabase.rpc("exec_sql", {
      sql: `SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
            AND routine_name IN ('handle_new_user', 'toggle_post_like', 'setup_admin_user');`,
    })

    if (!funcError && functions) {
      console.log(`   ✅ Database functions verified (${functions.length} found)`)
    } else {
      console.log(`   ⚠️  Could not verify functions: ${funcError?.message || "Unknown error"}`)
    }

    // Check extensions
    const { data: extensions, error: extError } = await supabase.rpc("exec_sql", {
      sql: `SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');`,
    })

    if (!extError && extensions) {
      console.log(`   ✅ Extensions verified (${extensions.length} found)`)
    }

    console.log("\n📋 VERIFICATION SUMMARY")
    console.log("=".repeat(40))
    console.log(`Tables verified: ${verifiedTables}/${tables.length}`)
    console.log(`Functions: ${functions?.length || 0} found`)
    console.log(`Extensions: ${extensions?.length || 0} found`)

    if (verifiedTables === tables.length) {
      console.log("\n🎉 All core components verified successfully!")
      console.log("\n📝 NEXT STEPS:")
      console.log("1. Create your first admin user account")
      console.log("2. Run: SELECT setup_admin_user('your-email@example.com');")
      console.log("3. Test the application features")
      console.log("4. Deploy to production")
    } else {
      console.log("\n⚠️  Some components may need manual verification")
    }
  } catch (err: any) {
    console.error("❌ Verification failed:", err.message)
  }
}

// Test database connection
async function testConnection() {
  try {
    console.log("🔍 Testing database connection...")
    const { data, error } = await supabase.from("information_schema.tables").select("*").limit(1)

    if (error) {
      console.error("❌ Database connection failed:", error.message)
      return false
    }

    console.log("✅ Database connection successful")
    return true
  } catch (err: any) {
    console.error("❌ Database connection test failed:", err.message)
    return false
  }
}

// Main execution
async function main() {
  console.log("🚀 MAHAKAVYA SOCIAL PLATFORM - DATABASE SETUP")
  console.log("=".repeat(60))

  const connected = await testConnection()
  if (!connected) {
    process.exit(1)
  }

  await runDatabaseSetup()
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Setup failed:", err)
    process.exit(1)
  })
}

export { runDatabaseSetup, verifySetup, testConnection }
