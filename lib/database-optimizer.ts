import { createSupabaseServerClient } from "./supabase-server"

export interface QueryOptimizationResult {
  query: string
  executionTime: number
  rowCount: number
  recommendations: string[]
}

export interface IndexRecommendation {
  table: string
  column: string
  reason: string
  estimatedImprovement: string
}

/**
 * Analyzes slow queries and provides optimization recommendations
 */
export async function analyzeSlowQueries(minDuration = 1000): Promise<QueryOptimizationResult[]> {
  const supabase = createSupabaseServerClient()

  // Query the pg_stat_statements extension for slow queries
  const { data, error } = await supabase.rpc("get_slow_queries", {
    min_duration_ms: minDuration,
  })

  if (error) {
    console.error("Error analyzing slow queries:", error)
    return []
  }

  return (data || []).map((row: any) => ({
    query: row.query,
    executionTime: row.mean_exec_time,
    rowCount: row.rows,
    recommendations: generateQueryRecommendations(row),
  }))
}

/**
 * Generates query optimization recommendations
 */
function generateQueryRecommendations(queryStats: any): string[] {
  const recommendations: string[] = []

  if (queryStats.mean_exec_time > 5000) {
    recommendations.push("Consider breaking this into multiple smaller queries")
  }

  if (queryStats.rows > 10000 && !queryStats.query.includes("LIMIT")) {
    recommendations.push("Add pagination with LIMIT and OFFSET")
  }

  if (queryStats.query.includes("SELECT *")) {
    recommendations.push("Select only the columns you need instead of SELECT *")
  }

  if (queryStats.calls > 1000) {
    recommendations.push("Consider caching this frequently-called query")
  }

  return recommendations
}

/**
 * Recommends indexes based on query patterns
 */
export async function recommendIndexes(): Promise<IndexRecommendation[]> {
  const supabase = createSupabaseServerClient()

  const recommendations: IndexRecommendation[] = []

  // Analyze common query patterns
  const commonQueries = [
    { table: "posts", column: "user_id", reason: "Frequent filtering by user" },
    { table: "posts", column: "created_at", reason: "Sorting and date filtering" },
    { table: "post_likes", column: "post_id", reason: "Join performance" },
    { table: "post_likes", column: "user_id", reason: "Checking user likes" },
    { table: "messages", column: "conversation_id", reason: "Message retrieval" },
    { table: "messages", column: "created_at", reason: "Message ordering" },
    { table: "notifications", column: "user_id", reason: "User notifications" },
    { table: "notifications", column: "read", reason: "Unread notifications" },
  ]

  for (const query of commonQueries) {
    // Check if index exists
    const { data } = await supabase.rpc("check_index_exists", {
      p_table: query.table,
      p_column: query.column,
    })

    if (!data) {
      recommendations.push({
        ...query,
        estimatedImprovement: "30-50% faster queries",
      })
    }
  }

  return recommendations
}

/**
 * Creates recommended indexes
 */
export async function createRecommendedIndexes(recommendations: IndexRecommendation[]): Promise<void> {
  const supabase = createSupabaseServerClient()

  for (const rec of recommendations) {
    const indexName = `idx_${rec.table}_${rec.column}`

    await supabase.rpc("create_index_if_not_exists", {
      p_index_name: indexName,
      p_table: rec.table,
      p_column: rec.column,
    })

    console.log(`Created index: ${indexName}`)
  }
}

/**
 * Query result caching with configurable TTL
 */
const queryCache = new Map<string, { data: any; timestamp: number }>()

export async function cachedQuery<T>(key: string, queryFn: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  const now = Date.now()
  const cached = queryCache.get(key)

  if (cached && now - cached.timestamp < ttlSeconds * 1000) {
    return cached.data as T
  }

  const data = await queryFn()
  queryCache.set(key, { data, timestamp: now })

  // Clean old cache entries periodically
  if (queryCache.size > 1000) {
    const cutoff = now - ttlSeconds * 1000
    for (const [k, v] of queryCache.entries()) {
      if (v.timestamp < cutoff) {
        queryCache.delete(k)
      }
    }
  }

  return data
}

/**
 * Batch query operations to reduce round trips
 */
export async function batchQuery<T>(tableName: string, ids: string[], selectQuery = "*"): Promise<T[]> {
  if (ids.length === 0) return []

  const supabase = createSupabaseServerClient()

  // Batch queries in chunks of 100
  const chunkSize = 100
  const results: T[] = []

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const { data } = await supabase.from(tableName).select(selectQuery).in("id", chunk)

    if (data) {
      results.push(...(data as T[]))
    }
  }

  return results
}
