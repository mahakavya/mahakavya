import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function seedAdminData() {
  console.log("🌱 Seeding admin dashboard data...")

  try {
    // Seed daily usage data for the last 30 days
    const usageData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      usageData.push({
        usage_date: date.toISOString().split("T")[0],
        dau: Math.floor(Math.random() * 500) + 100,
        new_signups: Math.floor(Math.random() * 50) + 5,
        premium_active: Math.floor(Math.random() * 100) + 20,
        posts: Math.floor(Math.random() * 200) + 50,
        reels: Math.floor(Math.random() * 100) + 20,
        messages: Math.floor(Math.random() * 1000) + 200,
      })
    }

    const { error: usageError } = await supabase.from("daily_usage").upsert(usageData, { onConflict: "usage_date" })

    if (usageError) {
      console.error("Error seeding usage data:", usageError)
    } else {
      console.log("✅ Seeded daily usage data")
    }

    // Seed some moderation flags
    const moderationFlags = [
      {
        content_type: "post",
        content_id: crypto.randomUUID(),
        reason: "Inappropriate content",
        status: "PENDING",
      },
      {
        content_type: "reel",
        content_id: crypto.randomUUID(),
        reason: "Spam",
        status: "PENDING",
      },
      {
        content_type: "comment",
        content_id: crypto.randomUUID(),
        reason: "Harassment",
        status: "APPROVED",
      },
    ]

    const { error: flagsError } = await supabase.from("moderation_flags").insert(moderationFlags)

    if (flagsError) {
      console.error("Error seeding moderation flags:", flagsError)
    } else {
      console.log("✅ Seeded moderation flags")
    }

    // Seed some fundraisers
    const fundraisers = [
      {
        title: "Help Build Community Center",
        description: "Supporting local community development",
        target_amount: 100000,
        raised_amount: 45000,
        status: "ACTIVE",
      },
      {
        title: "Education for All",
        description: "Providing educational resources",
        target_amount: 50000,
        raised_amount: 50000,
        status: "CLOSED",
      },
    ]

    const { error: fundraisersError } = await supabase.from("fundraisers").insert(fundraisers)

    if (fundraisersError) {
      console.error("Error seeding fundraisers:", fundraisersError)
    } else {
      console.log("✅ Seeded fundraisers")
    }

    // Seed some subscriptions
    const subscriptions = []
    for (let i = 0; i < 25; i++) {
      subscriptions.push({
        user_id: crypto.randomUUID(), // In production, use real user IDs
        plan: "PREMIUM",
        status: Math.random() > 0.1 ? "ACTIVE" : "CANCELLED",
        started_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    const { error: subscriptionsError } = await supabase.from("user_subscriptions").insert(subscriptions)

    if (subscriptionsError) {
      console.error("Error seeding subscriptions:", subscriptionsError)
    } else {
      console.log("✅ Seeded subscriptions")
    }

    console.log("🎉 Admin dashboard data seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
  }
}

// Run the seed function
seedAdminData()
