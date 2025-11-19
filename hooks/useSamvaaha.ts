"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Post as SupabasePost, Comment } from "@/lib/supabase/types"
import type { CursorPagination } from "@/lib/pagination"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { checkAccess } from "@/lib/access"

interface Post extends SupabasePost {
  isLiked: boolean
  isBookmarked: boolean
}

interface FeedResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  meta: {
    timestamp: string
    authenticated: boolean
  }
}

interface SamvaahaPost {
  id: string
  content: string
  media_urls: string[]
  author_id: string
  created_at: string
  updated_at: string
  visibility: "public" | "followers" | "private"
  likes_count: number
  comments_count: number
  shares_count: number
  isLiked: boolean
  isBookmarked: boolean
  author: {
    id: string
    display_name: string
    avatar_url?: string
    username: string
  }
}

interface CreatePostData {
  content: string
  media_urls?: string[]
  visibility?: "public" | "followers" | "private"
}

interface UseSamvaahaReturn {
  posts: SamvaahaPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  createPost: (data: CreatePostData) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  toggleLike: (postId: string) => Promise<void>
  toggleBookmark: (postId: string) => Promise<void>
}

const supabase = createClient()

// Feed hooks
export function useFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      try {
        const url = new URL("/api/samvaaha/feed", window.location.origin)
        url.searchParams.set("limit", limit.toString())
        if (pageParam) {
          url.searchParams.set("cursor", pageParam)
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        return response.json() as Promise<CursorPagination<Post>>
      } catch (error) {
        console.error("Feed fetch error:", error)
        throw error
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("Unauthorized")) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const response = await fetch(`/api/samvaaha/posts/${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to fetch post")
      }
      return response.json() as Promise<{ post: Post; comments: Comment[] }>
    },
    enabled: !!id,
  })
}

// Create post hook
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      body?: string
      media?: { name: string; type: string; size: number }[]
      visibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
    }) => {
      const response = await fetch("/api/samvaaha/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error || "Failed to create post")
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate and refetch feed
      queryClient.invalidateQueries({ queryKey: ["feed"] })

      // Add the new post to the beginning of the feed cache
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData) return oldData

        const newPages = [...oldData.pages]
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            items: [data.post, ...newPages[0].items],
          }
        }

        return {
          ...oldData,
          pages: newPages,
        }
      })
    },
  })
}

// Like post hook
export function useToggleLike(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/samvaaha/posts/${postId}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error || "Failed to toggle like")
      }

      return response.json() as Promise<{ liked: boolean; likeCount: number }>
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] })
      await queryClient.cancelQueries({ queryKey: ["post", postId] })

      // Snapshot the previous values
      const previousFeed = queryClient.getQueryData(["feed"])
      const previousPost = queryClient.getQueryData(["post", postId])

      // Optimistically update feed
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData) return oldData

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((post: Post) => {
            if (post.id === postId) {
              return {
                ...post,
                viewerHasLiked: !post.viewerHasLiked,
                like_count: post.viewerHasLiked ? post.like_count - 1 : post.like_count + 1,
              }
            }
            return post
          }),
        }))

        return {
          ...oldData,
          pages: newPages,
        }
      })

      // Optimistically update single post
      queryClient.setQueryData(["post", postId], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          post: {
            ...oldData.post,
            viewerHasLiked: !oldData.post.viewerHasLiked,
            like_count: oldData.post.viewerHasLiked ? oldData.post.like_count - 1 : oldData.post.like_count + 1,
          },
        }
      })

      return { previousFeed, previousPost }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["feed"], context.previousFeed)
      }
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["feed"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
    },
  })
}

// Bookmark post hook
export function useToggleBookmark(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/samvaaha/bookmarks/${postId}`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error || "Failed to toggle bookmark")
      }

      return response.json() as Promise<{ bookmarked: boolean }>
    },
    onMutate: async () => {
      // Optimistically update
      await queryClient.cancelQueries({ queryKey: ["feed"] })
      await queryClient.cancelQueries({ queryKey: ["post", postId] })

      const previousFeed = queryClient.getQueryData(["feed"])
      const previousPost = queryClient.getQueryData(["post", postId])

      // Update feed
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData) return oldData

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((post: Post) => {
            if (post.id === postId) {
              return {
                ...post,
                viewerBookmarked: !post.viewerBookmarked,
              }
            }
            return post
          }),
        }))

        return {
          ...oldData,
          pages: newPages,
        }
      })

      // Update single post
      queryClient.setQueryData(["post", postId], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          post: {
            ...oldData.post,
            viewerBookmarked: !oldData.post.viewerBookmarked,
          },
        }
      })

      return { previousFeed, previousPost }
    },
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["feed"], context.previousFeed)
      }
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] })
    },
  })
}

// Create comment hook
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { body: string }) => {
      const response = await fetch("/api/samvaaha/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          body: data.body,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error || "Failed to create comment")
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Update post comments
      queryClient.setQueryData(["post", postId], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          comments: [data.comment, ...oldData.comments],
          post: {
            ...oldData.post,
            comment_count: oldData.post.comment_count + 1,
          },
        }
      })

      // Update feed post comment count
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData) return oldData

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((post: Post) => {
            if (post.id === postId) {
              return {
                ...post,
                comment_count: post.comment_count + 1,
              }
            }
            return post
          }),
        }))

        return {
          ...oldData,
          pages: newPages,
        }
      })
    },
  })
}

// Like comment hook
export function useToggleCommentLike(commentId: string, postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/samvaaha/comments/${commentId}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle comment like")
      }

      return response.json() as Promise<{ liked: boolean; likeCount: number }>
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] })

      const previousPost = queryClient.getQueryData(["post", postId])

      queryClient.setQueryData(["post", postId], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          comments: oldData.comments.map((comment: Comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                viewerHasLiked: !comment.viewerHasLiked,
                like_count: comment.viewerHasLiked ? comment.like_count - 1 : comment.like_count + 1,
              }
            }
            return comment
          }),
        }
      })

      return { previousPost }
    },
    onError: (err, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost)
      }
    },
  })
}

// Bookmarks hook
export function useBookmarks(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["bookmarks"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/samvaaha/bookmarks", window.location.origin)
      url.searchParams.set("limit", limit.toString())
      if (pageParam) {
        url.searchParams.set("cursor", pageParam)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Failed to fetch bookmarks")
      }

      return response.json() as Promise<CursorPagination<Post>>
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  })
}

// Flag content hook
export function useFlagContent() {
  return useMutation({
    mutationFn: async (data: {
      content_type: "post" | "comment"
      content_id: string
      reason: string
    }) => {
      const response = await fetch("/api/samvaaha/flags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error || "Failed to flag content")
      }

      return response.json()
    },
  })
}

// Realtime subscriptions
export function useRealtimeSubscription() {
  const queryClient = useQueryClient()

  return {
    subscribeToFeed: () => {
      const channel = supabase
        .channel("samvaaha-feed")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "posts",
          },
          (payload) => {
            // Invalidate feed to show new posts
            queryClient.invalidateQueries({ queryKey: ["feed"] })
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "post_likes",
          },
          (payload) => {
            // Update like counts in real-time
            queryClient.invalidateQueries({ queryKey: ["feed"] })
            queryClient.invalidateQueries({ queryKey: ["post", payload.new.post_id] })
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "post_likes",
          },
          (payload) => {
            // Update like counts in real-time
            queryClient.invalidateQueries({ queryKey: ["feed"] })
            queryClient.invalidateQueries({ queryKey: ["post", payload.old.post_id] })
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
          },
          (payload) => {
            // Update comment counts and lists
            queryClient.invalidateQueries({ queryKey: ["feed"] })
            queryClient.invalidateQueries({ queryKey: ["post", payload.new.post_id] })
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    },
  }
}

export function useSamvaaha(): UseSamvaahaReturn {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const canRead = checkAccess(user, "canRead")
  const canWrite = checkAccess(user, "canWrite")

  const fetchPosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (!canRead) {
        setError("Access denied")
        setLoading(false)
        return
      }

      try {
        setError(null)
        if (!append) setLoading(true)

        const response = await fetch(`/api/samvaaha/feed?page=${pageNum}&limit=20`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (append) {
          setPosts((prev) => [...prev, ...data.posts])
        } else {
          setPosts(data.posts)
        }

        setHasMore(data.pagination.hasMore)
        setPage(pageNum)
      } catch (err) {
        console.error("Error fetching posts:", err)
        setError(err instanceof Error ? err.message : "Failed to load posts")
      } finally {
        setLoading(false)
      }
    },
    [canRead],
  )

  const createPost = useCallback(
    async (data: CreatePostData) => {
      if (!canWrite) {
        throw new Error("Access denied")
      }

      try {
        setError(null)

        const response = await fetch("/api/samvaaha/feed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()

        // Add the new post to the beginning of the list
        setPosts((prev) => [result.post, ...prev])
      } catch (err) {
        console.error("Error creating post:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to create post"
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [canWrite],
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchPosts(page + 1, true)
  }, [fetchPosts, hasMore, loading, page])

  const refresh = useCallback(async () => {
    setPage(1)
    setHasMore(true)
    await fetchPosts(1, false)
  }, [fetchPosts])

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return

      try {
        // Optimistic update
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: !post.isLiked,
                likes_count: post.isLiked ? post.likes_count - 1 : post.likes_count + 1,
              }
            }
            return post
          }),
        )

        const response = await fetch(`/api/samvaaha/posts/${postId}/like`, {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to toggle like")
        }
      } catch (err) {
        console.error("Error toggling like:", err)
        // Revert optimistic update on error
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: !post.isLiked,
                likes_count: post.isLiked ? post.likes_count + 1 : post.likes_count - 1,
              }
            }
            return post
          }),
        )
      }
    },
    [user],
  )

  const toggleBookmark = useCallback(
    async (postId: string) => {
      if (!user) return

      try {
        // Optimistic update
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isBookmarked: !post.isBookmarked,
              }
            }
            return post
          }),
        )

        const response = await fetch(`/api/samvaaha/bookmarks/${postId}`, {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to toggle bookmark")
        }
      } catch (err) {
        console.error("Error toggling bookmark:", err)
        // Revert optimistic update on error
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isBookmarked: !post.isBookmarked,
              }
            }
            return post
          }),
        )
      }
    },
    [user],
  )

  // Initial load
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    loading,
    error,
    hasMore,
    createPost,
    loadMore,
    refresh,
    toggleLike,
    toggleBookmark,
  }
}
