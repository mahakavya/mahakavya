"use client"
import useSWRInfinite from "swr/infinite"

export function useForYouFeed() {
  const getKey = (pageIndex: number, prev: any) => {
    if (prev && !prev.nextCursor) return null
    const cursor = pageIndex === 0 ? "" : `&cursor=${encodeURIComponent(prev.nextCursor)}`
    return `/api/feed/reco?limit=20${cursor}`
  }

  const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

  const swr = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  return swr
}
