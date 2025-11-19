import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runMigrationCheck() {
  console.log("🔍 Running database migration check...")

  try {
    // Read the migration check SQL
    const sqlPath = join(process.cwd(), "scripts", "database-migration-check.sql")
    const sql = readFileSync(sqlPath, "utf-8")

    // Execute the check
    const { data, error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("❌ Migration check failed:", error)
      return
    }

    if (!data || data.length === 0) {
      console.log("✅ Database schema is up to date!")
      return
    }

    console.log("⚠️  Found schema issues:")
    console.table(data)

    // Check for critical issues
    const criticalIssues = data.filter(
      (issue: any) => issue.issue_type === "Missing Table" || issue.issue_type === "Missing Column",
    )

    if (criticalIssues.length > 0) {
      console.log("\n🚨 Critical issues found that need immediate attention:")
      console.table(criticalIssues)

      console.log("\n📋 Recommended actions:")
      console.log("1. Run the complete schema migration: supabase/sql/001_schema_complete.sql")
      console.log("2. Apply any missing indexes and constraints")
      console.log("3. Re-run this check to verify fixes")
    }
  } catch (error) {
    console.error("❌ Error running migration check:", error)
  }
}

// Run the check
runMigrationCheck()
