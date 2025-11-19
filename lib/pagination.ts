export interface CursorPagination<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

export function createCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}:${id}`).toString("base64url")
}

export function parseCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString()
    const [createdAt, id] = decoded.split(":")
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

export function buildPaginatedResponse<T extends { id: string; created_at: string }>(
  items: T[],
  limit: number,
): CursorPagination<T> {
  const hasMore = items.length > limit
  const resultItems = hasMore ? items.slice(0, limit) : items

  let nextCursor: string | undefined
  if (hasMore && resultItems.length > 0) {
    const lastItem = resultItems[resultItems.length - 1]
    nextCursor = createCursor(lastItem.created_at, lastItem.id)
  }

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  }
}
