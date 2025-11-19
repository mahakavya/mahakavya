import { insertAuditLog, fetchAuditLogs } from "./supabase/audit"
import type { Database } from "./supabase/types"

export async function logAdminAction(actorId: string, action: string, target?: string, meta?: Record<string, any>) {
  try {
    // Database typing may not include `audit_logs` in every environment; cast the table builder to
    // any so we can insert a loosely-typed record without TypeScript 'never' errors.
    // supabase-js client types in this workspace cause a 'never' constraint for some table generics.
    // Use a narrow `any` cast on the table builder here to keep the call type-safe at the DB schema level
    // (we already added `audit_logs` to `lib/supabase/types.ts`) while avoiding the generic mismatch.
  await insertAuditLog({ actor_id: actorId, action, target, meta: meta || null })
  } catch (error) {
    console.error("Audit logging error:", error)
  }
}

export async function getAuditLogs(limit = 20) {
  return fetchAuditLogs(limit)
}

// Compatibility export: provide a simple namespace export named `audit`
export const audit = {
  logAdminAction,
  getAuditLogs,
}
