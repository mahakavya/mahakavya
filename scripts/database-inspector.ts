import { createSupabaseServerClient } from "@/lib/supabase"
import { isDemoMode } from "@/config/env"

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface IndexInfo {
  tablename: string
  indexname: string
  indexdef: string
}

interface PolicyInfo {
  tablename: string
  policyname: string
  cmd: string
  qual: string | null
  with_check: string | null
}

interface MigrationInfo {
  version: string
  applied_at: string
  description: string
}

export class DatabaseInspector {
  private supabase: any

  constructor() {
    this.supabase = null
  }

  async initialize() {
    if (isDemoMode()) {
      console.log("🔄 Demo mode active - skipping database inspection")
      return false
    }

    try {
      this.supabase = await createSupabaseServerClient()
      return true
    } catch (error) {
      console.error("❌ Failed to initialize database connection:", error)
      return false
    }
  }

  async inspectTables(): Promise<TableInfo[]> {
    if (!this.supabase) return []

    try {
      const { data, error } = await this.supabase.rpc("get_table_info")
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("❌ Failed to inspect tables:", error)
      return []
    }
  }

  async inspectIndexes(): Promise<IndexInfo[]> {
    if (!this.supabase) return []

    try {
      const { data, error } = await this.supabase.rpc("get_index_info")
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("❌ Failed to inspect indexes:", error)
      return []
    }
  }

  async inspectPolicies(): Promise<PolicyInfo[]> {
    if (!this.supabase) return []

    try {
      const { data, error } = await this.supabase.rpc("get_policy_info")
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("❌ Failed to inspect policies:", error)
      return []
    }
  }

  async checkMigrations(): Promise<MigrationInfo[]> {
    if (!this.supabase) return []

    try {
      const { data, error } = await this.supabase.from("schema_migrations").select("*").order("version")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("❌ Failed to check migrations:", error)
      return []
    }
  }

  async getPendingMigrations(): Promise<string[]> {
    const expectedMigrations = [
      "001_schema_complete",
      "002_rls",
      "003_indexes",
      "004_functions",
      "005_search",
      "006_analytics",
      "007_notifications",
      "008_safety",
      "009_rate_limits",
      "010_push",
    ]

    const appliedMigrations = await this.checkMigrations()
    const appliedVersions = appliedMigrations.map((m) => m.version)

    return expectedMigrations.filter((version) => !appliedVersions.includes(version))
  }

  async generateReport(): Promise<string> {
    if (isDemoMode()) {
      return `
# Database Inspection Report (Demo Mode)

⚠️  **Demo Mode Active** - Database inspection skipped

The application is running in demo mode. To inspect the actual database:
1. Set up a Supabase project
2. Configure environment variables
3. Set DEMO_MODE=false
4. Run the inspection again

## Demo Mode Features:
- ✅ All API endpoints mocked
- ✅ Authentication simulated
- ✅ Data operations return mock responses
- ✅ No external dependencies required

To deploy with a real database, follow the setup instructions in the documentation.
`
    }

    const initialized = await this.initialize()
    if (!initialized) {
      return `
# Database Inspection Report

❌ **Failed to connect to database**

Please check:
1. Supabase configuration in environment variables
2. Database connection settings
3. Network connectivity
4. Supabase project status

## Environment Check:
- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"}
`
    }

    const tables = await this.inspectTables()
    const indexes = await this.inspectIndexes()
    const policies = await this.inspectPolicies()
    const migrations = await this.checkMigrations()
    const pendingMigrations = await this.getPendingMigrations()

    return `
# Database Inspection Report

Generated: ${new Date().toISOString()}

## Migration Status

### Applied Migrations (${migrations.length})
${migrations.map((m) => `- ✅ ${m.version}: ${m.description} (${m.applied_at})`).join("\n")}

### Pending Migrations (${pendingMigrations.length})
${pendingMigrations.map((m) => `- ⏳ ${m}: Not applied`).join("\n")}

## Database Schema

### Tables (${tables.length > 0 ? new Set(tables.map((t) => t.table_name)).size : 0})
${
  tables.length > 0
    ? Array.from(new Set(tables.map((t) => t.table_name)))
        .map((tableName) => {
          const tableColumns = tables.filter((t) => t.table_name === tableName)
          return `
#### ${tableName}
${tableColumns
  .map(
    (col) =>
      `- ${col.column_name}: ${col.data_type}${col.is_nullable === "NO" ? " NOT NULL" : ""}${col.column_default ? ` DEFAULT ${col.column_default}` : ""}`,
  )
  .join("\n")}`
        })
        .join("\n")
    : "❌ No tables found"
}

### Indexes (${indexes.length})
${indexes.length > 0 ? indexes.map((idx) => `- ${idx.tablename}.${idx.indexname}`).join("\n") : "❌ No indexes found"}

### RLS Policies (${policies.length})
${
  policies.length > 0
    ? policies.map((pol) => `- ${pol.tablename}.${pol.policyname} (${pol.cmd})`).join("\n")
    : "❌ No RLS policies found"
}

## Recommendations

${
  pendingMigrations.length > 0
    ? `
### 🚨 Action Required
Run the following migrations:
\`\`\`sql
${pendingMigrations.map((m) => `-- Apply migration: ${m}`).join("\n")}
\`\`\`
`
    : "✅ All migrations are up to date"
}

${
  tables.length === 0
    ? `
### 🚨 Critical Issue
No tables found in the database. Run the initial schema migration:
\`\`\`bash
npm run db:migrate
\`\`\`
`
    : ""
}

${
  policies.length === 0
    ? `
### ⚠️  Security Warning
No RLS policies found. This means your data is not protected. Apply RLS policies immediately.
`
    : ""
}

## Next Steps

1. ${pendingMigrations.length > 0 ? "Apply pending migrations" : "✅ Migrations up to date"}
2. ${policies.length === 0 ? "Set up RLS policies" : "✅ RLS policies configured"}
3. ${indexes.length < 10 ? "Add performance indexes" : "✅ Indexes configured"}
4. Test application functionality
5. Monitor database performance

---
*Report generated by Mahakavya Database Inspector*
`
  }
}

// CLI usage
if (require.main === module) {
  const inspector = new DatabaseInspector()
  inspector
    .generateReport()
    .then((report) => {
      console.log(report)
      process.exit(0)
    })
    .catch((error) => {
      console.error("Failed to generate report:", error)
      process.exit(1)
    })
}
