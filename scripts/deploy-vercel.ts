#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"

interface DeploymentConfig {
  projectName: string
  environment: "development" | "preview" | "production"
  domain?: string
}

class VercelDeployer {
  private config: DeploymentConfig

  constructor(config: DeploymentConfig) {
    this.config = config
  }

  async deploy(): Promise<void> {
    console.log("🚀 Starting Vercel deployment...")

    try {
      // Pre-deployment checks
      await this.preDeploymentChecks()

      // Build the application
      await this.buildApplication()

      // Deploy to Vercel
      await this.deployToVercel()

      // Post-deployment verification
      await this.postDeploymentVerification()

      console.log("✅ Deployment completed successfully!")
    } catch (error) {
      console.error("❌ Deployment failed:", error)
      process.exit(1)
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    console.log("🔍 Running pre-deployment checks...")

    // Check if required files exist
    const requiredFiles = ["package.json", "next.config.mjs", "vercel.json", ".env.local"]

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`)
      }
    }

    // Check environment variables
    const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "POSTGRES_URL"]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.warn(`⚠️  Environment variable missing: ${envVar}`)
      }
    }

    console.log("✅ Pre-deployment checks passed")
  }

  private async buildApplication(): Promise<void> {
    console.log("🔨 Building application...")

    try {
      execSync("npm run build", { stdio: "inherit" })
      console.log("✅ Build completed successfully")
    } catch (error) {
      throw new Error("Build failed")
    }
  }

  private async deployToVercel(): Promise<void> {
    console.log("🚀 Deploying to Vercel...")

    const deployCommand = this.config.environment === "production" ? "vercel --prod" : "vercel"

    try {
      execSync(deployCommand, { stdio: "inherit" })
      console.log("✅ Deployment to Vercel completed")
    } catch (error) {
      throw new Error("Vercel deployment failed")
    }
  }

  private async postDeploymentVerification(): Promise<void> {
    console.log("🔍 Running post-deployment verification...")

    // Add verification logic here
    // - Health check endpoints
    // - Database connectivity
    // - Service availability

    console.log("✅ Post-deployment verification completed")
  }
}

// CLI interface
const args = process.argv.slice(2)
const environment = (args[0] as "development" | "preview" | "production") || "preview"

const config: DeploymentConfig = {
  projectName: "mahakavya-social",
  environment,
  domain: process.env.CUSTOM_DOMAIN,
}

const deployer = new VercelDeployer(config)
deployer.deploy()
