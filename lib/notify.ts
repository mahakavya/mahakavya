export type NotifyKind = "message" | "donation" | "draw" | "session" | "system"

export async function createNotification(
  sb: any,
  userId: string,
  payload: { kind: NotifyKind; title: string; body?: string; href?: string },
) {
  return sb
    .from("notifications")
    .insert({ user_id: userId, ...payload })
    .select("id")
    .single()
}

export async function markRead(sb: any, userId: string, ids?: string[]) {
  const q = sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId)
  return ids?.length ? q.in("id", ids) : q.is("read_at", null)
}
