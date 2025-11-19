import { createClient } from "@supabase/supabase-js"

interface ChecklistItem {
  category: string
  task: string
  required: boolean
  completed: boolean
  description: string
  action?: string
}

class DeploymentChecklist {
  private items: ChecklistItem[] = []
  private supabase: any

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
    this.setupChecklist()
  }

  private setupChecklist() {
    // Environment setup
    this.items.push({
      category: "Environment",
      task: "Set NEXT_PUBLIC_SUPABASE_URL",
      required: true,
      completed: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      description: "Supabase project URL for client-side connections",
      action: "Add to your deployment platform environment variables",
    })

    this.items.push({
      category: "Environment",
      task: "Set NEXT_PUBLIC_SUPABASE_ANON_KEY",
      required: true,
      completed: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      description: "Supabase anonymous key for client authentication",
      action: "Add to your deployment platform environment variables",
    })

    this.items.push({
      category: "Environment",
      task: "Set SUPABASE_SERVICE_ROLE_KEY",
      required: true,
      completed: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      description: "Supabase service role key for server-side operations",
      action: "Add to your deployment platform environment variables",
    })

    this.items.push({
      category: "Environment",
      task: "Configure Razorpay keys (if using payments)",
      required: false,
      completed: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      description: "Payment gateway configuration for donations and subscriptions",
      action: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
    })

    // Database setup
    this.items.push({
      category: "Database",
      task: "Run database migrations",
      required: true,
      completed: false, // Will be checked dynamically
      description: "Set up all required database tables and functions",
      action: "Run: npm run db:migrate",
    })

    this.items.push({
      category: "Database",
      task: "Verify all tables exist",
      required: true,
      completed: false, // Will be checked dynamically
      description: "Ensure all application tables are created",
      action: "Run: npm run db:verify",
    })

    this.items.push({
      category: "Database",
      task: "Create first admin user",
      required: true,
      completed: false, // Will be checked dynamically
      description: "Set up initial admin account for platform management",
      action: "Run: npm run setup:admin",
    })

    // Security
    this.items.push({
      category: "Security",
      task: "Configure HTTPS/SSL",
      required: true,
      completed: false, // Manual verification needed
      description: "Ensure secure connections for all traffic",
      action: "Configure SSL certificate in your hosting platform",
    })

    this.items.push({
      category: "Security",
      task: "Review and test authentication flow",
      required: true,
      completed: false, // Manual verification needed
      description: "Verify login, signup, and password reset work correctly",
      action: "Test all authentication flows in staging",
    })

    // Features
    this.items.push({
      category: "Features",
      task: "Test user registration/login",
      required: true,
      completed: false, // Manual verification needed
      description: "Verify core user authentication works",
      action: "Create test accounts and verify login flow",
    })

    this.items.push({
      category: "Features",
      task: "Test social feed functionality",
      required: true,
      completed: false, // Manual verification needed
      description: "Verify posts, likes, comments work correctly",
      action: "Test creating posts and interactions",
    })

    this.items.push({
      category: "Features",
      task: "Test all API endpoints",
      required: true,
      completed: false, // Manual verification needed
      description: "Verify all API routes respond correctly",
      action: "Run API tests or manual verification",
    })

    // Performance
    this.items.push({
      category: "Performance",
      task: "Configure CDN and caching",
      required: false,
      completed: false, // Manual verification needed
      description: "Set up content delivery and caching for better performance",
      action: "Configure CDN in your hosting platform",
    })

    this.items.push({
      category: "Performance",
      task: "Set up monitoring and alerting",
      required: false,
      completed: false, // Manual verification needed
      description: "Monitor application health and performance",
      action: "Configure monitoring tools (Vercel Analytics, Sentry, etc.)",
    })
  }

  async checkDatabaseStatus() {
    if (!this.supabase) return

    try {
      // Check if profiles table exists and has data structure
      const { data: profiles } = await this.supabase.from("profiles").select("*").limit(1)
      const profilesItem = this.items.find((item) => item.task === "Verify all tables exist")
      if (profilesItem) {
        profilesItem.completed = profiles !== null
      }

      // Check if migrations have been run (look for specific tables/functions)
      const { data: tables } = await this.supabase.rpc("get_table_count")
      const migrationsItem = this.items.find((item) => item.task === "Run database migrations")
      if (migrationsItem) {
        migrationsItem.completed = tables && tables > 10 // Should have many tables after migrations
      }

      // Check if admin user exists
      const { data: admins } = await this.supabase.from("profiles").select("*").eq("role", "admin").limit(1)

      const adminItem = this.items.find((item) => item.task === "Create first admin user")
      if (adminItem) {
        adminItem.completed = admins && admins.length > 0
      }
    } catch (error) {
      console.log("Could not check database status:", error)
    }
  }

  async generateChecklist() {
    console.log("📋 DEPLOYMENT CHECKLIST\n")
    console.log("=".repeat(60))

    await this.checkDatabaseStatus()

    const categories = [...new Set(this.items.map((item) => item.category))]

    for (const category of categories) {
      console.log(`\n### 📂 ${category.toUpperCase()}`)
      const categoryItems = this.items.filter((item) => item.category === category)

      for (const item of categoryItems) {
        const status = item.completed ? "✅" : item.required ? "❌" : "⚠️"
        const required = item.required ? "[REQUIRED]" : "[OPTIONAL]"

        console.log(`${status} ${item.task} ${required}`)
        console.log(`   ${item.description}`)
        if (!item.completed && item.action) {
          console.log(`   Action: ${item.action}`)
        }
        console.log("")
      }
    }

    // Summary
    const totalItems = this.items.length
    const completedItems = this.items.filter((item) => item.completed).length
    const requiredItems = this.items.filter((item) => item.required).length
    const completedRequired = this.items.filter((item) => item.required && item.completed).length

    console.log("=".repeat(60))
    console.log(`📊 CHECKLIST SUMMARY`)
    console.log(`Total Items: ${completedItems}/${totalItems} completed`)
    console.log(`Required Items: ${completedRequired}/${requiredItems} completed`)

    const readyForDeployment = completedRequired === requiredItems

    if (readyForDeployment) {
      console.log("🎉 READY FOR DEPLOYMENT!")
      console.log("All required items are completed. You can deploy to production.")
    } else {
      console.log("⚠️ NOT READY FOR DEPLOYMENT")
      console.log(`Complete ${requiredItems - completedRequired} more required items before deploying.`)
    }

    return {
      totalItems,
      completedItems,
      requiredItems,
      completedRequired,
      readyForDeployment,
      items: this.items,
    }
  }
}

// Main execution
if (require.main === module) {
  const checklist = new DeploymentChecklist()
  checklist.generateChecklist().catch(console.error)
}

export { DeploymentChecklist }
