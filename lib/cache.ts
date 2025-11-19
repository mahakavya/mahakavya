// Simple in-memory cache with TTL support
interface CacheEntry<T> {
  value: T
  expires: number
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000,
    )
  }

  set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expires = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expires })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  size(): number {
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

export const cache = new CacheService()
