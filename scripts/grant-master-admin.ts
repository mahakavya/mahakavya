import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function grantMasterAdminAccess() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const masterAdminEmail = "sreekar.pratap@gmail.com"

  try {
    console.log(`Granting Master Admin access to ${masterAdminEmail}...`)

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("email", masterAdminEmail)
      .single()

    if (findError || !user) {
      console.error("User not found:", findError)
      return
    }

    console.log(`Found user: ${user.name} (${user.email})`)

    // Update user to Master Admin
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_admin: true,
        role: "master_admin",
        verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating user role:", updateError)
      return
    }

    console.log("✅ Master Admin role granted")

    // Grant lifetime premium subscription
    const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
      user_id: user.id,
      status: "active",
      plan: "lifetime_premium",
      intro_used: true,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100 years
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      return
    }

    console.log("✅ Lifetime premium subscription granted")

    // Grant all feature access
    const { error: accessError } = await supabase.from("feature_access").upsert({
      user_id: user.id,
      can_feed: true,
      can_reels: true,
      can_luckydraw: true,
      can_fundraising: true,
      can_emotional: true,
      can_messaging: true,
      updated_at: new Date().toISOString(),
    })

    if (accessError) {
      console.error("Error granting feature access:", accessError)
      return
    }

    console.log("✅ All feature access granted")

    // Log the action
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_type: "master_admin_granted",
      event_data: {
        granted_to: user.id,
        granted_email: masterAdminEmail,
        granted_at: new Date().toISOString(),
        features: ["lifetime_premium", "master_admin", "all_features"],
      },
    })

    console.log("✅ Action logged")
    console.log(`\n🎉 Master Admin access successfully granted to ${masterAdminEmail}`)
    console.log("Features granted:")
    console.log("- Master Admin role")
    console.log("- Lifetime Premium subscription")
    console.log("- All platform features")
    console.log("- Verified status")
  } catch (error) {
    console.error("Error granting Master Admin access:", error)
  }
}

// Run the script
grantMasterAdminAccess()
