"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { PostComposer } from "@/components/samvaaha/PostComposer"
import { PostCard } from "@/components/samvaaha/PostCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFeed, useBookmarks, useRealtimeSubscription } from "@/hooks/useSamvaaha"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Bookmark, TrendingUp, Users } from "lucide-react"
import { toast } from "sonner"

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="w-full">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SuggestedUsers() {
  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Suggested for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-6 text-xs bg-transparent">
              Follow
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TrendingTopics() {
  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {["#MahakavyaLife", "#TechTalk", "#Inspiration", "#Community"].map((tag, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{tag}</span>
            <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 1000)}k posts</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function BookmarksPreview() {
  const { data: bookmarks, isLoading } = useBookmarks(5)

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Recent Bookmarks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const bookmarkPosts = bookmarks?.pages.flatMap((page) => page.items) || []

  if (bookmarkPosts.length === 0) {
    return null
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Recent Bookmarks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bookmarkPosts.slice(0, 3).map((post) => (
          <div key={post.id} className="text-sm">
            <p className="line-clamp-2 text-muted-foreground">{post.body || "Media post"}</p>
            <p className="text-xs text-muted-foreground mt-1">by {post.author.display_name}</p>
          </div>
        ))}
        {bookmarkPosts.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full h-6 text-xs">
            View all bookmarks
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function SamvaahaPage() {
  const { user } = useAuth()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFeed()

  const { subscribeToFeed } = useRealtimeSubscription()

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToFeed()
    return unsubscribe
  }, [])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load feed")
    }
  }, [error])

  const posts = data?.pages.flatMap((page) => page.items) || []

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Welcome to Samvaaha</h2>
            <p className="text-muted-foreground mb-4">
              Join our community to share your thoughts and connect with others.
            </p>
            <Button asChild>
              <a href="/sanketa/signin">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Samvaaha
              </h1>
              <p className="text-muted-foreground mt-1">Share your thoughts with the community</p>
            </motion.div>

            {/* Post Composer */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <PostComposer />
            </motion.div>

            {/* Feed */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {isLoading ? (
                <FeedSkeleton />
              ) : posts.length > 0 ? (
                <>
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}

                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="flex justify-center pt-6">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        className="backdrop-blur-sm bg-white/80 border-white/20"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More Posts"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                      <p className="text-sm">Be the first to share something with the community!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <BookmarksPreview />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <TrendingTopics />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <SuggestedUsers />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
