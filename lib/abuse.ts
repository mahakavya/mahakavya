export async function isShadowMuted(sb: any, userId: string): Promise<boolean> {
  const { data } = await sb.from("profiles").select("shadow_muted").eq("id", userId).single()
  return !!data?.shadow_muted
}

export function hideIfShadowMuted<T extends { is_hidden?: boolean }>(muted: boolean, row: T): T {
  return muted ? { ...row, is_hidden: true } : row
}
