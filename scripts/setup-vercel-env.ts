#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"
import readline from "readline"

interface EnvironmentVariable {
  key: string
  value: string
  description: string
  required: boolean
  sensitive: boolean
}

const environmentVariables: EnvironmentVariable[] = [
  // Supabase Configuration
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    value: "https://bjkanvzpgpbxtebqkbww.supabase.co",
    description: "Supabase project URL",
    required: true,
    sensitive: false,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2FudnpwZ3BieHRlYnFrYnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NzI4NzQsImV4cCI6MjA1MjM0ODg3NH0.wCOoQJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJ",
    description: "Supabase anonymous key",
    required: true,
    sensitive: true,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2FudnpwZ3BieHRlYnFrYnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjc3Mjg3NCwiZXhwIjoyMDUyMzQ4ODc0fQ.wCOoQJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJ",
    description: "Supabase service role key (admin access)",
    required: true,
    sensitive: true,
  },

  // Payment Configuration
  {
    key: "RAZORPAY_KEY_ID",
    value: "rzp_live_1G1FGPZa3AmNML",
    description: "Razorpay Live Key ID",
    required: true,
    sensitive: false,
  },
  {
    key: "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    value: "rzp_live_1G1FGPZa3AmNML",
    description: "Razorpay Live Key ID (public)",
    required: true,
    sensitive: false,
  },
  {
    key: "RAZORPAY_KEY_SECRET",
    value: "REPLACE_WITH_ACTUAL_SECRET",
    description: "Razorpay Live Key Secret",
    required: true,
    sensitive: true,
  },

  // App Configuration
  {
    key: "NEXT_PUBLIC_APP_URL",
    value: "https://mahakavya.app",
    description: "Production app URL",
    required: true,
    sensitive: false,
  },
  {
    key: "NEXT_PUBLIC_DEMO_MODE",
    value: "false",
    description: "Disable demo mode for production",
    required: true,
    sensitive: false,
  },
  {
    key: "NODE_ENV",
    value: "production",
    description: "Node environment",
    required: true,
    sensitive: false,
  },

  // Authentication
  {
    key: "NEXTAUTH_SECRET",
    value: "GENERATE_RANDOM_SECRET_HERE",
    description: "NextAuth secret for JWT signing",
    required: true,
    sensitive: true,
  },
  {
    key: "NEXTAUTH_URL",
    value: "https://mahakavya.app",
    description: "NextAuth callback URL",
    required: true,
    sensitive: false,
  },

  // Optional AI Services
  {
    key: "OPENAI_API_KEY",
    value: "OPTIONAL_OPENAI_KEY",
    description: "OpenAI API key for AI features",
    required: false,
    sensitive: true,
  },
  {
    key: "BLOCKCHAIN_API_KEY",
    value: "OPTIONAL_BLOCKCHAIN_KEY",
    description: "Blockchain API key for verification",
    required: false,
    sensitive: true,
  },

  // Push Notifications
  {
    key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    value: "OPTIONAL_VAPID_PUBLIC_KEY",
    description: "VAPID public key for push notifications",
    required: false,
    sensitive: false,
  },
  {
    key: "VAPID_PRIVATE_KEY",
    value: "OPTIONAL_VAPID_PRIVATE_KEY",
    description: "VAPID private key for push notifications",
    required: false,
    sensitive: true,
  },
  {
    key: "VAPID_SUBJECT",
    value: "mailto:support@mahakavya.app",
    description: "VAPID subject for push notifications",
    required: false,
    sensitive: false,
  },
]

class VercelEnvironmentSetup {
  private rl: readline.Interface

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  private async promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  private generateRandomSecret(length = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private async checkVercelCLI(): Promise<void> {
    try {
      execSync("vercel --version", { stdio: "pipe" })
      console.log("✅ Vercel CLI is available")
    } catch {
      console.log("📦 Installing Vercel CLI...")
      execSync("npm install -g vercel", { stdio: "inherit" })
    }

    try {
      execSync("vercel whoami", { stdio: "pipe" })
      console.log("✅ Logged in to Vercel")
    } catch {
      console.log("🔐 Please log in to Vercel...")
      execSync("vercel login", { stdio: "inherit" })
    }
  }

  private async setEnvironmentVariable(envVar: EnvironmentVariable): Promise<void> {
    let value = envVar.value

    // Generate secrets for placeholder values
    if (value === "GENERATE_RANDOM_SECRET_HERE") {
      value = this.generateRandomSecret()
      console.log(`🔐 Generated random secret for ${envVar.key}`)
    }

    // Skip optional variables with placeholder values
    if (!envVar.required && (value.startsWith("OPTIONAL_") || value.startsWith("REPLACE_WITH_"))) {
      console.log(`⏭️ Skipping optional ${envVar.key}`)
      return
    }

    // Prompt for sensitive values that need replacement
    if (envVar.sensitive && value.startsWith("REPLACE_WITH_")) {
      const maskedKey = envVar.key.replace(/./g, "*").slice(0, -4) + envVar.key.slice(-4)
      value = await this.promptUser(`🔑 Enter ${envVar.description} (${maskedKey}): `)

      if (!value) {
        console.log(`⚠️ Skipping ${envVar.key} - no value provided`)
        return
      }
    }

    try {
      // Create temporary file for sensitive data
      const tempFile = `/tmp/vercel_env_${Date.now()}`
      fs.writeFileSync(tempFile, value)

      // Set environment variable for all environments
      const environments = ["production", "preview", "development"]

      for (const env of environments) {
        try {
          execSync(`vercel env add ${envVar.key} ${env} < ${tempFile}`, {
            stdio: ["pipe", "pipe", "pipe"],
          })
          console.log(`✅ Set ${envVar.key} for ${env}`)
        } catch (error) {
          // Variable might already exist
          try {
            execSync(`vercel env rm ${envVar.key} ${env} --yes`, { stdio: "pipe" })
            execSync(`vercel env add ${envVar.key} ${env} < ${tempFile}`, { stdio: "pipe" })
            console.log(`🔄 Updated ${envVar.key} for ${env}`)
          } catch {
            console.log(`⚠️ Could not set ${envVar.key} for ${env}`)
          }
        }
      }

      // Clean up temporary file
      fs.unlinkSync(tempFile)
    } catch (error) {
      console.error(`❌ Failed to set ${envVar.key}:`, error)
    }
  }

  public async setup(): Promise<void> {
    try {
      console.log("🚀 Setting up Mahakavya Social Platform environment variables...\n")

      await this.checkVercelCLI()

      console.log("\n📋 Environment Variables to Configure:")
      environmentVariables.forEach((envVar, index) => {
        const status = envVar.required ? "🔴 Required" : "🟡 Optional"
        const type = envVar.sensitive ? "🔒 Sensitive" : "🔓 Public"
        console.log(`${index + 1}. ${envVar.key} - ${status} ${type}`)
        console.log(`   ${envVar.description}`)
      })

      const proceed = await this.promptUser("\n❓ Do you want to proceed with environment setup? (y/N): ")
      if (proceed.toLowerCase() !== "y" && proceed.toLowerCase() !== "yes") {
        console.log("❌ Setup cancelled")
        return
      }

      console.log("\n🔧 Setting environment variables...")

      for (const envVar of environmentVariables) {
        await this.setEnvironmentVariable(envVar)
      }

      console.log("\n✅ Environment setup completed!")
      console.log("\n📋 Summary:")
      console.log("🔗 Supabase: bjkanvzpgpbxtebqkbww.supabase.co")
      console.log("💳 Razorpay: rzp_live_1G1FGPZa3AmNML")
      console.log("🌐 App URL: https://mahakavya.app")
      console.log("💰 Payment Page: https://rzp.io/rzp/Q0Olcv4")

      console.log("\n🚀 Next Steps:")
      console.log("1. Run deployment: npm run deploy")
      console.log("2. Configure Razorpay webhooks")
      console.log("3. Test payment integration")
      console.log("4. Set up custom domain DNS")
    } catch (error) {
      console.error("\n❌ Environment setup failed:", error)
      process.exit(1)
    } finally {
      this.rl.close()
    }
  }
}

// Run setup
if (require.main === module) {
  const setup = new VercelEnvironmentSetup()
  setup.setup().catch(console.error)
}

export default VercelEnvironmentSetup
