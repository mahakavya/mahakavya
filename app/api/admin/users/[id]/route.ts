import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UserUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(["active", "suspended", "banned", "pending"]).optional(),
  role: z.enum(["user", "moderator", "admin", "super_admin"]).optional(),
  is_verified: z.boolean().optional(),
  subscription_status: z.enum(["free", "premium", "enterprise"]).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id
    const body = await request.json()
    const updates = UserUpdateSchema.parse(body)

    // Update user
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log the update action
    await supabase.from("user_actions").insert({
      user_id: userId,
      admin_id: user.id,
      action: "update",
      timestamp: new Date().toISOString(),
      metadata: { updates },
    })

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data,
    })
  } catch (error) {
    console.error("Error in admin user PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id

    // Delete user
    const { error } = await supabase.from("profiles").delete().eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    // Log the delete action
    await supabase.from("user_actions").insert({
      user_id: userId,
      admin_id: user.id,
      action: "delete",
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error in admin user DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
