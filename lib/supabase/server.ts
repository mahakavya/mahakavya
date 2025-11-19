import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { ENV } from "@/config/env"

export async function createSupabaseServerClientInternal() {
  // Lazily obtain the cookies store to avoid importing next/headers at
  // module initialization time which would mark this module as a Server
  // Component.
  let cookieStore: any = { getAll: () => [], setAll: () => {} }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const _nextHeaders = require("next/headers")
    if (_nextHeaders && typeof _nextHeaders.cookies === "function") {
      cookieStore = _nextHeaders.cookies()
    }
  } catch (err) {
    // Not in a Next server component environment — keep no-op store.
  }

  return createSupabaseServerClient(
    ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL || "",
    ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll ? cookieStore.getAll() : []
        },
        setAll(cookiesToSet: any[]) {
          try {
            if (cookieStore && typeof cookieStore.set === "function") {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            }
          } catch (error) {
            // Ignore errors when setting cookies outside server components.
          }
        },
      },
    },
  )
}

export async function createServiceClient() {
  return createSupabaseServerClient(
    ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL || "",
    ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for service client
        },
      },
    },
  )
}

// Export the required createServerClient function
export const createServerClient = createSupabaseServerClientInternal

// Legacy exports for backward compatibility
export const createClient = createSupabaseServerClientInternal

export { createSupabaseServerClient }
