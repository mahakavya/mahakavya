import { toast } from "@/components/ui/use-toast"

export function handleRateLimit(response: Response) {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After")
    const seconds = retryAfter ? Number.parseInt(retryAfter) : 60

    toast({
      title: "You're going too fast",
      description: `Please wait ${seconds} seconds before trying again.`,
      variant: "destructive",
    })

    return true
  }
  return false
}

export async function fetchWithRateLimit(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options)

    if (handleRateLimit(response)) {
      throw new Error("Rate limited")
    }

    return response
  } catch (error) {
    throw error
  }
}
