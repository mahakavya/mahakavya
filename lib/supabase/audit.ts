import supabase from "./client"
import type { Database } from "./types"

export type AuditInsert = Database["public"]["Tables"]["audit_logs"]["Insert"]
export type AuditRow = Database["public"]["Tables"]["audit_logs"]["Row"]

export async function insertAuditLog(entry: AuditInsert): Promise<AuditRow | null> {
  // supabase-js client types may produce a 'never' constraint for the table insert generics in this
  // workspace. Cast the table builder to `any` locally to avoid that while keeping typed function
  // signatures for callers.
  const table: any = supabase.from("audit_logs")
  const { data, error } = await table.insert([entry]).select().maybeSingle()
  if (error) throw error
  return data as AuditRow | null
}

export async function fetchAuditLogs(limit = 20): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(`*, actor:profiles(full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Failed to fetch audit logs:", error)
    return []
  }

  return (data || []) as AuditRow[]
}

export default {
  insertAuditLog,
  fetchAuditLogs,
}
