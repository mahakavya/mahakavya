import { createServerClient as createSupabaseClient } from "@supabase/ssr"
import type { Database } from "./database.types"

export function createSupabaseServerClient() {
  // Lazily obtain a cookies store. Avoid importing `next/headers` at module
  // top-level so this file can be imported from pages and other runtimes.
  let cookieStore: any = {
    get() {
      return undefined
    },
    set() {},
    remove() {},
  }

  try {
    // Use CommonJS require inside the function to avoid top-level ESM import
    // which causes Next to treat this module as a Server Component.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const _nextHeaders = require("next/headers")
    if (_nextHeaders && typeof _nextHeaders.cookies === "function") {
      cookieStore = _nextHeaders.cookies()
    }
  } catch (err) {
    // Not running in an environment that provides next/headers — keep no-op
    // cookie store.
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Export aliases for compatibility
export const createServerClient = createSupabaseServerClient
export const createClient = createSupabaseServerClient

export async function getServerSession() {
  const supabase = createSupabaseServerClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting server session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Failed to get server session:", error)
    return null
  }
}

export async function getServerUser() {
  const supabase = createSupabaseServerClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting server user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Failed to get server user:", error)
    return null
  }
}
