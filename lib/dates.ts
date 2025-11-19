// Date formatting and manipulation utilities

export function formatIST(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  })
}

export function formatISTWithTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  } else {
    return formatIST(dateString)
  }
}

export function daysUntil(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
}

export function isExpired(dateString: string): boolean {
  return new Date(dateString) < new Date()
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function addMonths(dateString: string, months: number): string {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

export function getStartOfDay(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function getEndOfDay(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date()
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

export function formatDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffInMs = end.getTime() - start.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes`
  } else {
    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    return `${hours}h ${minutes}m`
  }
}
