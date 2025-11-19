import { createClient } from "@supabase/supabase-js"
import { env } from "@/config/env"

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteToAdmin(email: string) {
  console.log(`🚀 Promoting ${email} to admin...`)

  try {
    // Call the setup_admin_user function
    const { data, error } = await supabase.rpc("setup_admin_user", {
      admin_email: email,
    })

    if (error) {
      console.error("❌ Database error:", error.message)
      return false
    }

    if (data) {
      console.log(`✅ Successfully promoted ${email} to admin!`)

      // Verify the promotion
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, is_admin, role, is_verified")
        .eq("email", email)
        .single()

      if (profileError) {
        console.error("❌ Error verifying promotion:", profileError.message)
        return false
      }

      console.log("📊 User Profile:")
      console.log(`   Email: ${profile.email}`)
      console.log(`   Admin: ${profile.is_admin ? "✅ Yes" : "❌ No"}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Verified: ${profile.is_verified ? "✅ Yes" : "❌ No"}`)

      // Check feature access
      const { data: features, error: featuresError } = await supabase
        .from("feature_access")
        .select("feature_name, has_access")
        .eq("user_id", (await supabase.from("profiles").select("id").eq("email", email).single()).data?.id)

      if (!featuresError && features) {
        console.log("🎯 Feature Access:")
        features.forEach((feature) => {
          console.log(`   ${feature.feature_name}: ${feature.has_access ? "✅" : "❌"}`)
        })
      }

      return true
    } else {
      console.error(`❌ User with email ${email} not found. Please make sure they have signed up first.`)
      return false
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err)
    return false
  }
}

// Get email from command line arguments or use the provided email
const email = process.argv[2] || "sreekar.pratap@gmail.com"

if (!email) {
  console.error("❌ Please provide an email address")
  console.log("Usage: npm run promote-admin <email@example.com>")
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error("❌ Please provide a valid email address")
  process.exit(1)
}

promoteToAdmin(email).then((success) => {
  if (success) {
    console.log("\n🎉 Admin promotion completed successfully!")
    console.log("The user can now access:")
    console.log("   • Admin Dashboard: /admin")
    console.log("   • User Management: /admin/users")
    console.log("   • Analytics: /admin/analytics")
    console.log("   • All platform features")
  } else {
    console.log("\n❌ Admin promotion failed. Please check the errors above.")
    process.exit(1)
  }
})
