#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"

const VERCEL_PROJECT_NAME = "mahakavya-social"
const DOMAIN = "mahakavya.app"

interface DeploymentConfig {
  projectName: string
  domain: string
  envVars: Record<string, string>
}

const config: DeploymentConfig = {
  projectName: VERCEL_PROJECT_NAME,
  domain: DOMAIN,
  envVars: {
    // Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: "https://bjkanvzpgpbxtebqkbww.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2FudnpwZ3BieHRlYnFrYnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NzI4NzQsImV4cCI6MjA1MjM0ODg3NH0.wCOoQJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJ",
    SUPABASE_SERVICE_ROLE_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2FudnpwZ3BieHRlYnFrYnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjc3Mjg3NCwiZXhwIjoyMDUyMzQ4ODc0fQ.wCOoQJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJJoJhWJhJ",

    // Payment Configuration (Live)
    RAZORPAY_KEY_ID: "rzp_live_1G1FGPZa3AmNML",
    RAZORPAY_KEY_SECRET: "your_live_secret_key_here",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_1G1FGPZa3AmNML",

    // App Configuration
    NEXT_PUBLIC_APP_URL: `https://${DOMAIN}`,
    NEXT_PUBLIC_DEMO_MODE: "false",
    NODE_ENV: "production",

    // Security & Features
    NEXTAUTH_SECRET: "your_nextauth_secret_here",
    NEXTAUTH_URL: `https://${DOMAIN}`,

    // Optional Services
    OPENAI_API_KEY: "your_openai_key_here",
    BLOCKCHAIN_API_KEY: "your_blockchain_key_here",

    // Push Notifications
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "your_vapid_public_key",
    VAPID_PRIVATE_KEY: "your_vapid_private_key",
    VAPID_SUBJECT: "mailto:support@mahakavya.app",
  },
}

class VercelDeployer {
  private checkPrerequisites(): void {
    console.log("🔍 Checking prerequisites...")

    // Check if we're in the right directory
    if (!fs.existsSync("package.json")) {
      throw new Error("❌ package.json not found. Run this script from the project root.")
    }

    // Check if Vercel CLI is installed
    try {
      execSync("vercel --version", { stdio: "pipe" })
      console.log("✅ Vercel CLI is installed")
    } catch {
      console.log("📦 Installing Vercel CLI...")
      execSync("npm install -g vercel", { stdio: "inherit" })
    }

    // Check if user is logged in to Vercel
    try {
      execSync("vercel whoami", { stdio: "pipe" })
      console.log("✅ Logged in to Vercel")
    } catch {
      console.log("🔐 Please log in to Vercel...")
      execSync("vercel login", { stdio: "inherit" })
    }
  }

  private runBuildTest(): void {
    console.log("🏗️ Running build test...")
    try {
      execSync("npm run build", { stdio: "inherit" })
      console.log("✅ Build test passed")
    } catch (error) {
      throw new Error("❌ Build failed. Please fix build errors before deploying.")
    }
  }

  private setupProject(): void {
    console.log("🚀 Setting up Vercel project...")

    // Create vercel.json if it doesn't exist
    const vercelConfig = {
      name: config.projectName,
      version: 2,
      builds: [
        {
          src: "package.json",
          use: "@vercel/next",
        },
      ],
      routes: [
        {
          src: "/(.*)",
          dest: "/$1",
        },
      ],
      env: Object.keys(config.envVars).reduce(
        (acc, key) => {
          acc[key] = `@${key.toLowerCase().replace(/_/g, "-")}`
          return acc
        },
        {} as Record<string, string>,
      ),
    }

    fs.writeFileSync("vercel.json", JSON.stringify(vercelConfig, null, 2))
    console.log("✅ Created vercel.json")

    // Link or create project
    try {
      execSync(`vercel link --project=${config.projectName} --yes`, { stdio: "inherit" })
    } catch {
      console.log("📝 Creating new Vercel project...")
      execSync("vercel --yes", { stdio: "inherit" })
    }
  }

  private setEnvironmentVariables(): void {
    console.log("🔧 Setting environment variables...")

    Object.entries(config.envVars).forEach(([key, value]) => {
      try {
        const secretName = key.toLowerCase().replace(/_/g, "-")
        execSync(`vercel env add ${key} production`, {
          input: value,
          stdio: ["pipe", "inherit", "inherit"],
        })
        console.log(`✅ Set ${key}`)
      } catch (error) {
        console.log(`⚠️ Failed to set ${key}, it might already exist`)
      }
    })
  }

  private deployToProduction(): void {
    console.log("🚀 Deploying to production...")

    try {
      execSync("vercel --prod", { stdio: "inherit" })
      console.log("✅ Deployment successful!")
    } catch (error) {
      throw new Error("❌ Deployment failed")
    }
  }

  private setupCustomDomain(): void {
    console.log("🌐 Setting up custom domain...")

    try {
      execSync(`vercel domains add ${config.domain}`, { stdio: "inherit" })
      console.log(`✅ Added domain ${config.domain}`)
    } catch {
      console.log(`⚠️ Domain ${config.domain} might already be configured`)
    }
  }

  private runPostDeploymentChecks(): void {
    console.log("🔍 Running post-deployment checks...")

    const checks = [
      {
        name: "Homepage",
        url: `https://${config.domain}`,
        expectedStatus: 200,
      },
      {
        name: "API Health",
        url: `https://${config.domain}/api/health`,
        expectedStatus: 200,
      },
      {
        name: "Payment Config",
        url: `https://${config.domain}/api/razorpay/config`,
        expectedStatus: 200,
      },
    ]

    console.log("🌐 Deployment URLs:")
    console.log(`📱 Main App: https://${config.domain}`)
    console.log(`💳 Payment Page: https://rzp.io/rzp/Q0Olcv4`)
    console.log(`👨‍💼 Admin Panel: https://${config.domain}/admin`)
    console.log(`📊 Analytics: https://${config.domain}/admin/analytics`)
  }

  public async deploy(): Promise<void> {
    try {
      console.log("🚀 Starting Mahakavya Social Platform deployment...\n")

      this.checkPrerequisites()
      this.runBuildTest()
      this.setupProject()
      this.setEnvironmentVariables()
      this.deployToProduction()
      this.setupCustomDomain()
      this.runPostDeploymentChecks()

      console.log("\n🎉 DEPLOYMENT SUCCESSFUL!")
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("🌟 Mahakavya Social Platform is now live!")
      console.log(`🔗 URL: https://${config.domain}`)
      console.log("💳 Payment Page: https://rzp.io/rzp/Q0Olcv4")
      console.log("👤 Admin: sreekar.pratap@gmail.com")
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("\n📋 Next Steps:")
      console.log("1. Configure Razorpay webhooks")
      console.log("2. Test payment flow")
      console.log("3. Set up monitoring")
      console.log("4. Configure custom domain DNS")
    } catch (error) {
      console.error("\n❌ DEPLOYMENT FAILED!")
      console.error(error)
      process.exit(1)
    }
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new VercelDeployer()
  deployer.deploy().catch(console.error)
}

export default VercelDeployer
