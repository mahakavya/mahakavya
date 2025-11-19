import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  }

  if (count < 1000000) {
    const k = Math.floor(count / 100) / 10
    return k % 1 === 0 ? `${Math.floor(k)}K` : `${k}K`
  }

  const m = Math.floor(count / 100000) / 10
  return m % 1 === 0 ? `${Math.floor(m)}M` : `${m}M`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }

  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 60) {
    return "just now"
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`
  } else if (diffInHours < 24) {
    return `${diffInHours}h`
  } else if (diffInDays < 7) {
    return `${diffInDays}d`
  } else {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%"
  const percentage = (value / total) * 100
  return `${Math.round(percentage)}%`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function randomColor(): string {
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase()
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

export function removeHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0900-\u097F]+/g
  return text.match(hashtagRegex) || []
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w\u0900-\u097F]+/g
  return text.match(mentionRegex) || []
}

export function isValidHashtag(hashtag: string): boolean {
  return /^#[\w\u0900-\u097F]+$/.test(hashtag)
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase()
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"]
  return imageExtensions.includes(getFileExtension(filename))
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv"]
  return videoExtensions.includes(getFileExtension(filename))
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }

  // Fallback for older browsers
  const textArea = document.createElement("textarea")
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand("copy")
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  } finally {
    document.body.removeChild(textArea)
  }
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function shareUrl(url: string, title?: string): Promise<void> {
  if (navigator.share) {
    return navigator.share({ url, title })
  }

  // Fallback to copying URL
  return copyToClipboard(url)
}

export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop"

  const width = window.innerWidth

  if (width < 768) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}

export function isMobile(): boolean {
  return getDeviceType() === "mobile"
}

export function isTablet(): boolean {
  return getDeviceType() === "tablet"
}

export function isDesktop(): boolean {
  return getDeviceType() === "desktop"
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    },
    {} as Record<string, T[]>,
  )
}

// Object utilities
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => {
    delete result[key]
  })
  return result
}

export function isEmpty(obj: any): boolean {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === "string") return obj.length === 0
  if (typeof obj === "object") return Object.keys(obj).length === 0
  return false
}

// Local storage utilities
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Handle quota exceeded or other errors
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Handle errors
  }
}
