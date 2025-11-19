import type { SupabaseClient } from "@supabase/supabase-js"

export async function getCurrentProfile(supabase: SupabaseClient) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error("Error in getCurrentProfile:", error)
    return null
  }
}

export async function getSession(supabase: SupabaseClient) {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Error in getSession:", error)
    return null
  }
}

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data: profile, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

  if (error || !profile?.is_admin) {
    throw new Error("Admin access required")
  }

  return true
}

export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: any,
) {
  try {
    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_type: action,
      event_data: {
        entity,
        entity_id: entityId,
        metadata,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error logging audit event:", error)
  }
}

export async function getUserFeatureAccess(supabase: SupabaseClient, userId: string) {
  try {
    const { data: features, error } = await supabase
      .from("feature_access")
      .select("feature_name, has_access")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching feature access:", error)
      return {}
    }

    const accessMap: Record<string, boolean> = {}
    features?.forEach((feature) => {
      accessMap[feature.feature_name] = feature.has_access
    })

    return accessMap
  } catch (error) {
    console.error("Error in getUserFeatureAccess:", error)
    return {}
  }
}
