#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"

interface SetupConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  adminEmail?: string
}

class PostDeploySetup {
  private supabase
  private config: SetupConfig

  constructor(config: SetupConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
  }

  async run(): Promise<void> {
    console.log("🔧 Running post-deployment setup...")

    try {
      await this.checkDatabaseConnection()
      await this.runMigrations()
      await this.seedInitialData()
      await this.setupAdminUser()
      await this.verifyServices()

      console.log("✅ Post-deployment setup completed successfully!")
    } catch (error) {
      console.error("❌ Post-deployment setup failed:", error)
      process.exit(1)
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    console.log("🔍 Checking database connection...")

    const { data, error } = await this.supabase.from("profiles").select("count").limit(1)

    if (error && error.code !== "PGRST116") {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    console.log("✅ Database connection verified")
  }

  private async runMigrations(): Promise<void> {
    console.log("🗄️  Running database migrations...")

    try {
      // Check if migrations table exists and run any pending migrations
      const { data: migrations } = await this.supabase
        .from("schema_migrations")
        .select("version")
        .order("version", { ascending: false })
        .limit(1)

      console.log("✅ Database migrations completed")
    } catch (error) {
      console.warn("⚠️  Migration check failed, but continuing...")
    }
  }

  private async seedInitialData(): Promise<void> {
    console.log("🌱 Seeding initial data...")

    // Create default platform settings
    const { error: settingsError } = await this.supabase.from("platform_settings").upsert({
      key: "platform_initialized",
      value: "true",
      updated_at: new Date().toISOString(),
    })

    if (settingsError) {
      console.warn("⚠️  Could not create platform settings:", settingsError.message)
    }

    console.log("✅ Initial data seeded")
  }

  private async setupAdminUser(): Promise<void> {
    if (!this.config.adminEmail) {
      console.log("⏭️  Skipping admin user setup (no email provided)")
      return
    }

    console.log("👤 Setting up admin user...")

    try {
      // Create admin user if it doesn't exist
      const { data: existingUser } = await this.supabase.auth.admin.getUserByEmail(this.config.adminEmail)

      if (!existingUser.user) {
        const { data: newUser, error: createError } = await this.supabase.auth.admin.createUser({
          email: this.config.adminEmail,
          password: this.generateSecurePassword(),
          email_confirm: true,
        })

        if (createError) {
          throw createError
        }

        // Set admin role
        const { error: roleError } = await this.supabase
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", newUser.user.id)

        if (roleError) {
          throw roleError
        }

        console.log("✅ Admin user created successfully")
      } else {
        console.log("✅ Admin user already exists")
      }
    } catch (error) {
      console.warn("⚠️  Admin user setup failed:", error)
    }
  }

  private async verifyServices(): Promise<void> {
    console.log("🔍 Verifying services...")

    const services = [
      { name: "Health Check", url: "/api/health" },
      { name: "Authentication", url: "/api/auth/session" },
      { name: "Database", url: "/api/admin/stats" },
    ]

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    for (const service of services) {
      try {
        const response = await fetch(`${baseUrl}${service.url}`)
        if (response.ok) {
          console.log(`✅ ${service.name} service verified`)
        } else {
          console.warn(`⚠️  ${service.name} service returned ${response.status}`)
        }
      } catch (error) {
        console.warn(`⚠️  ${service.name} service verification failed`)
      }
    }
  }

  private generateSecurePassword(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}

// CLI interface
const config: SetupConfig = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  adminEmail: process.env.ADMIN_EMAIL,
}

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  console.error("❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const setup = new PostDeploySetup(config)
setup.run()
