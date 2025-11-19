import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BulkActionSchema = z.object({
  action_type: z.enum(["suspend", "activate", "verify", "delete", "send_notification"]),
  user_ids: z.array(z.string().uuid()),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    const body = await request.json()
    const { action_type, user_ids, reason } = BulkActionSchema.parse(body)

    // Create bulk action record
    const { data: bulkAction, error: bulkActionError } = await supabase
      .from("bulk_actions")
      .insert({
        action_type,
        user_ids,
        status: "processing",
        progress: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bulkActionError) {
      console.error("Error creating bulk action:", bulkActionError)
      return NextResponse.json({ error: "Failed to create bulk action" }, { status: 500 })
    }

    // Process bulk action asynchronously
    processBulkAction(bulkAction.id, action_type, user_ids, reason)

    return NextResponse.json({
      success: true,
      message: "Bulk action started successfully",
      data: { bulk_action_id: bulkAction.id },
    })
  } catch (error) {
    console.error("Error in admin bulk action POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processBulkAction(bulkActionId: string, actionType: string, userIds: string[], reason?: string) {
  const supabase = await createClient()

  let successCount = 0
  let failureCount = 0
  const errors: string[] = []

  try {
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]
      const progress = Math.round(((i + 1) / userIds.length) * 100)

      try {
        // Update progress
        await supabase.from("bulk_actions").update({ progress }).eq("id", bulkActionId)

        // Perform action based on type
        switch (actionType) {
          case "suspend":
            await supabase
              .from("profiles")
              .update({ status: "suspended", updated_at: new Date().toISOString() })
              .eq("id", userId)
            break
          case "activate":
            await supabase
              .from("profiles")
              .update({ status: "active", updated_at: new Date().toISOString() })
              .eq("id", userId)
            break
          case "verify":
            await supabase
              .from("profiles")
              .update({ is_verified: true, updated_at: new Date().toISOString() })
              .eq("id", userId)
            break
          case "delete":
            await supabase.from("profiles").delete().eq("id", userId)
            break
          case "send_notification":
            // Send notification logic would go here
            break
        }

        successCount++
      } catch (error) {
        failureCount++
        errors.push(`Failed to process user ${userId}: ${error}`)
      }
    }

    // Update bulk action with results
    await supabase
      .from("bulk_actions")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        results: {
          success_count: successCount,
          failure_count: failureCount,
          errors,
        },
      })
      .eq("id", bulkActionId)
  } catch (error) {
    console.error("Error processing bulk action:", error)

    // Mark as failed
    await supabase
      .from("bulk_actions")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        results: {
          success_count: successCount,
          failure_count: failureCount,
          errors: [...errors, `Bulk action failed: ${error}`],
        },
      })
      .eq("id", bulkActionId)
  }
}
