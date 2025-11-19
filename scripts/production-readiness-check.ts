import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"

interface CheckResult {
  category: string
  item: string
  status: "PASS" | "FAIL" | "WARNING"
  message: string
  critical: boolean
}

class ProductionReadinessChecker {
  private results: CheckResult[] = []
  private supabase: any

  constructor() {
    // Initialize Supabase client if credentials are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  }

  private addResult(
    category: string,
    item: string,
    status: "PASS" | "FAIL" | "WARNING",
    message: string,
    critical = false,
  ) {
    this.results.push({ category, item, status, message, critical })
  }

  async checkEnvironmentVariables() {
    console.log("🔍 Checking environment variables...")

    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

    const optionalEnvVars = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"]

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult("Environment", envVar, "PASS", "Required environment variable present", true)
      } else {
        this.addResult("Environment", envVar, "FAIL", "Required environment variable missing", true)
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.addResult("Environment", envVar, "PASS", "Optional environment variable present")
      } else {
        this.addResult(
          "Environment",
          envVar,
          "WARNING",
          "Optional environment variable missing - some features may not work",
        )
      }
    }
  }

  async checkDatabaseSchema() {
    console.log("🗄️ Checking database schema...")

    if (!this.supabase) {
      this.addResult("Database", "Connection", "FAIL", "Cannot connect to database - missing credentials", true)
      return
    }

    const requiredTables = [
      "profiles",
      "posts",
      "post_likes",
      "comments",
      "follows",
      "campaigns",
      "donations",
      "draws",
      "reels",
      "conversations",
      "messages",
      "notifications",
    ]

    for (const table of requiredTables) {
      try {
        const { data, error } = await this.supabase.from(table).select("*").limit(1)
        if (error) {
          this.addResult("Database", `Table: ${table}`, "FAIL", `Table missing or inaccessible: ${error.message}`, true)
        } else {
          this.addResult("Database", `Table: ${table}`, "PASS", "Table exists and accessible")
        }
      } catch (error) {
        this.addResult("Database", `Table: ${table}`, "FAIL", `Error checking table: ${error}`, true)
      }
    }

    // Check RLS policies
    try {
      const { data: policies } = await this.supabase.rpc("get_policies_count")
      if (policies && policies > 0) {
        this.addResult("Database", "RLS Policies", "PASS", `${policies} RLS policies active`)
      } else {
        this.addResult("Database", "RLS Policies", "WARNING", "No RLS policies found - security risk")
      }
    } catch (error) {
      this.addResult("Database", "RLS Policies", "WARNING", "Could not check RLS policies")
    }
  }

  checkFileStructure() {
    console.log("📁 Checking file structure...")

    const requiredFiles = [
      "package.json",
      "next.config.mjs",
      "middleware.ts",
      "app/layout.tsx",
      "app/page.tsx",
      "components/ui/button.tsx",
      "lib/supabase.ts",
    ]

    for (const file of requiredFiles) {
      if (existsSync(file)) {
        this.addResult("Files", file, "PASS", "Required file exists")
      } else {
        this.addResult("Files", file, "FAIL", "Required file missing", true)
      }
    }

    // Check optional but recommended files
    const recommendedFiles = [".env.example", "public/robots.txt", "public/sitemap.xml", "public/sw.js"]

    for (const file of recommendedFiles) {
      if (existsSync(file)) {
        this.addResult("Files", file, "PASS", "Recommended file exists")
      } else {
        this.addResult("Files", file, "WARNING", "Recommended file missing")
      }
    }
  }

  checkDependencies() {
    console.log("📦 Checking dependencies...")

    try {
      const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

      const criticalDeps = ["@supabase/ssr", "@supabase/supabase-js", "next", "react", "tailwindcss"]

      const optionalDeps = ["razorpay", "web-push", "@types/web-push"]

      for (const dep of criticalDeps) {
        if (dependencies[dep]) {
          this.addResult("Dependencies", dep, "PASS", "Critical dependency present", true)
        } else {
          this.addResult("Dependencies", dep, "FAIL", "Critical dependency missing", true)
        }
      }

      for (const dep of optionalDeps) {
        if (dependencies[dep]) {
          this.addResult("Dependencies", dep, "PASS", "Optional dependency present")
        } else {
          this.addResult("Dependencies", dep, "WARNING", "Optional dependency missing")
        }
      }
    } catch (error) {
      this.addResult("Dependencies", "package.json", "FAIL", "Cannot read package.json", true)
    }
  }

  checkAPIRoutes() {
    console.log("🔌 Checking API routes...")

    const criticalRoutes = [
      "app/api/health/route.ts",
      "app/api/me/access/route.ts",
      "app/api/feed/posts/route.ts",
      "app/api/analytics/track/route.ts",
    ]

    const featureRoutes = ["app/api/campaigns/route.ts", "app/api/draws/route.ts", "app/api/reels/route.ts"]

    for (const route of criticalRoutes) {
      if (existsSync(route)) {
        this.addResult(
          "API Routes",
          route.replace("app/api/", "/api/").replace("/route.ts", ""),
          "PASS",
          "Critical API route exists",
          true,
        )
      } else {
        this.addResult(
          "API Routes",
          route.replace("app/api/", "/api/").replace("/route.ts", ""),
          "FAIL",
          "Critical API route missing",
          true,
        )
      }
    }

    for (const route of featureRoutes) {
      if (existsSync(route)) {
        this.addResult(
          "API Routes",
          route.replace("app/api/", "/api/").replace("/route.ts", ""),
          "PASS",
          "Feature API route exists",
        )
      } else {
        this.addResult(
          "API Routes",
          route.replace("app/api/", "/api/").replace("/route.ts", ""),
          "WARNING",
          "Feature API route missing",
        )
      }
    }
  }

  checkSecurityConfiguration() {
    console.log("🔒 Checking security configuration...")

    // Check middleware
    if (existsSync("middleware.ts")) {
      this.addResult("Security", "Middleware", "PASS", "Middleware file exists", true)
    } else {
      this.addResult("Security", "Middleware", "FAIL", "Middleware file missing - no route protection", true)
    }

    // Check next.config.mjs for security headers
    if (existsSync("next.config.mjs")) {
      try {
        const config = readFileSync("next.config.mjs", "utf8")
        if (config.includes("headers") || config.includes("security")) {
          this.addResult("Security", "Security Headers", "PASS", "Security headers configured")
        } else {
          this.addResult("Security", "Security Headers", "WARNING", "Security headers not explicitly configured")
        }
      } catch (error) {
        this.addResult("Security", "Security Headers", "WARNING", "Could not check security headers configuration")
      }
    }

    // Check production mode
    if (process.env.NODE_ENV === "production") {
      this.addResult("Security", "Production Mode", "PASS", "Running in production mode")
    } else {
      this.addResult("Security", "Production Mode", "WARNING", "Not running in production mode")
    }
  }

  checkUserFlows() {
    console.log("👤 Checking user flows...")

    const criticalFlows = [
      { path: "app/page.tsx", name: "Landing Page" },
      { path: "app/signup/page.tsx", name: "User Registration" },
      { path: "app/login/page.tsx", name: "User Login" },
      { path: "app/dashboard/page.tsx", name: "Dashboard" },
    ]

    const featureFlows = [
      { path: "app/(shell)/varta/page.tsx", name: "Social Feed" },
      { path: "app/(shell)/samvaaha/page.tsx", name: "Messaging" },
      { path: "app/(shell)/nivedana/page.tsx", name: "Fundraising" },
    ]

    for (const flow of criticalFlows) {
      if (existsSync(flow.path)) {
        this.addResult("User Flows", flow.name, "PASS", "Critical user flow implemented", true)
      } else {
        this.addResult("User Flows", flow.name, "FAIL", "Critical user flow missing", true)
      }
    }

    for (const flow of featureFlows) {
      if (existsSync(flow.path)) {
        this.addResult("User Flows", flow.name, "PASS", "Feature flow implemented")
      } else {
        this.addResult("User Flows", flow.name, "WARNING", "Feature flow missing")
      }
    }
  }

  async runAllChecks() {
    console.log("🚀 Starting comprehensive production readiness check...\n")

    await this.checkEnvironmentVariables()
    await this.checkDatabaseSchema()
    this.checkFileStructure()
    this.checkDependencies()
    this.checkAPIRoutes()
    this.checkSecurityConfiguration()
    this.checkUserFlows()

    return this.generateReport()
  }

  generateReport() {
    console.log("\n📊 PRODUCTION READINESS REPORT\n")
    console.log("=".repeat(50))

    const categories = [...new Set(this.results.map((r) => r.category))]

    let totalScore = 0
    let maxScore = 0
    let criticalIssues = 0

    for (const category of categories) {
      console.log(`\n### ${category.toUpperCase()}`)
      const categoryResults = this.results.filter((r) => r.category === category)

      for (const result of categoryResults) {
        const icon = result.status === "PASS" ? "✅" : result.status === "WARNING" ? "⚠️" : "❌"
        console.log(`${icon} ${result.status}: ${result.item} - ${result.message}`)

        if (result.status === "PASS") totalScore += result.critical ? 3 : 1
        if (result.status === "WARNING") totalScore += result.critical ? 1 : 0.5
        if (result.status === "FAIL" && result.critical) criticalIssues++

        maxScore += result.critical ? 3 : 1
      }
    }

    const readinessScore = Math.round((totalScore / maxScore) * 100)

    console.log("\n" + "=".repeat(50))
    console.log(`📈 OVERALL READINESS SCORE: ${readinessScore}%`)
    console.log(`🚨 CRITICAL ISSUES: ${criticalIssues}`)

    if (criticalIssues === 0 && readinessScore >= 85) {
      console.log("🎉 EXCELLENT! Your application is PRODUCTION-READY!")
    } else if (criticalIssues === 0 && readinessScore >= 70) {
      console.log("✅ GOOD! Your application is mostly ready for production.")
    } else if (criticalIssues <= 2) {
      console.log("⚠️ NEEDS ATTENTION: Address critical issues before deployment.")
    } else {
      console.log("❌ NOT READY: Multiple critical issues need to be resolved.")
    }

    return {
      score: readinessScore,
      criticalIssues,
      results: this.results,
      ready: criticalIssues === 0 && readinessScore >= 85,
    }
  }
}

// Main execution
if (require.main === module) {
  const checker = new ProductionReadinessChecker()
  checker.runAllChecks().catch(console.error)
}

export { ProductionReadinessChecker }
