import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupAdminUser() {
  const adminEmail = "sreekar.pratap@gmail.com"

  console.log("🔧 MAHAKAVYA SOCIAL PLATFORM - ADMIN USER SETUP")
  console.log("=".repeat(60))
  console.log(`📧 Setting up admin user: ${adminEmail}`)
  console.log(`📍 Target database: ${supabaseUrl}`)

  try {
    // First, check if the user exists in profiles
    console.log("\n🔍 Checking if user exists...")
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id, email, name, is_admin, role")
      .eq("email", adminEmail)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error checking user:", checkError.message)
      return
    }

    if (!existingUser) {
      console.log("⚠️  User not found in profiles table")
      console.log("📝 The user must sign up first before being granted admin access")
      console.log("\n📋 Steps to complete admin setup:")
      console.log("1. 👤 User should sign up at: /signup")
      console.log("2. ✅ Verify email address")
      console.log("3. 🔄 Run this script again")
      return
    }

    console.log("✅ User found in database")
    console.log(`   📧 Email: ${existingUser.email}`)
    console.log(`   👤 Name: ${existingUser.name || "Not set"}`)
    console.log(`   🔐 Current Admin Status: ${existingUser.is_admin ? "Yes" : "No"}`)
    console.log(`   🏷️  Current Role: ${existingUser.role}`)

    // Execute the setup_admin_user function
    console.log("\n🚀 Executing admin setup function...")
    const { data: result, error: setupError } = await supabase.rpc("setup_admin_user", { admin_email: adminEmail })

    if (setupError) {
      console.error("❌ Admin setup failed:", setupError.message)
      return
    }

    if (result) {
      console.log("✅ Admin setup successful!")

      // Verify the changes
      console.log("\n🔍 Verifying admin privileges...")
      const { data: updatedUser, error: verifyError } = await supabase
        .from("profiles")
        .select("id, email, name, is_admin, role, is_verified")
        .eq("email", adminEmail)
        .single()

      if (verifyError) {
        console.error("❌ Verification failed:", verifyError.message)
        return
      }

      console.log("✅ Admin privileges verified:")
      console.log(`   📧 Email: ${updatedUser.email}`)
      console.log(`   👤 Name: ${updatedUser.name || "Not set"}`)
      console.log(`   🔐 Admin Status: ${updatedUser.is_admin ? "✅ YES" : "❌ NO"}`)
      console.log(`   🏷️  Role: ${updatedUser.role}`)
      console.log(`   ✅ Verified: ${updatedUser.is_verified ? "YES" : "NO"}`)

      // Check feature access
      console.log("\n🔍 Checking feature access...")
      const { data: features, error: featuresError } = await supabase
        .from("feature_access")
        .select("feature_name, has_access")
        .eq("user_id", updatedUser.id)

      if (featuresError) {
        console.error("⚠️  Could not verify feature access:", featuresError.message)
      } else {
        console.log("✅ Feature access granted:")
        features?.forEach((feature) => {
          const status = feature.has_access ? "✅" : "❌"
          console.log(`   ${status} ${feature.feature_name}`)
        })
      }

      console.log("\n" + "=".repeat(60))
      console.log("🎉 ADMIN USER SETUP COMPLETE!")
      console.log("=".repeat(60))
      console.log(`👑 ${adminEmail} is now a platform administrator`)
      console.log("\n📋 Admin capabilities enabled:")
      console.log("   🛡️  Access to admin panel (/admin)")
      console.log("   👥 User management and moderation")
      console.log("   📊 Analytics and monitoring")
      console.log("   💰 Payment and subscription management")
      console.log("   🎲 Draw and campaign management")
      console.log("   🔧 Platform settings and configuration")
      console.log("   📈 Content moderation and safety tools")

      console.log("\n🚀 Next steps:")
      console.log("1. 🔐 Sign in with the admin account")
      console.log("2. 🏠 Visit /admin to access the admin panel")
      console.log("3. 🧪 Test admin features and permissions")
      console.log("4. 👥 Invite other team members if needed")
    } else {
      console.log("❌ Admin setup returned false - user may not exist")
    }
  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message)
    console.error("🔧 Please check your database connection and permissions")
  }
}

// Execute the admin setup
setupAdminUser()
