import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your environment variables in the Vercel dashboard or .env.local file.",
    )
    throw new Error("Missing Supabase URL configuration")
  }
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please add it to your environment variables in the Vercel dashboard or .env.local file.",
    )
    throw new Error("Missing Supabase Anon Key configuration")
  }
  return key
}

// Default, client-side Supabase instance should use the public anon key.
// For server/service-role actions use `createServiceClient` in server code.
export const supabase = createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey())

// Back-compat helper used across the codebase: many modules call `createClient()`.
// If callers pass a URL and key, we create a fresh client; otherwise return the
// shared `supabase` instance above.
export function createClient(url?: string, key?: string, opts?: any) {
  if (url && key) {
    return createSupabaseClient<Database>(url, key, opts)
  }

  return supabase
}

// Typed helper: callers can use `fromTable('table_name')` and get a PostgrestQueryBuilder
export function fromTable<TableName extends keyof Database["public"]["Tables"] & string>(name: TableName) {
  return supabase.from(name as any) as any
}

export default supabase
