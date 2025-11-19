import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Simple in-memory cache for session validation
const sessionCache = new Map<string, { session: any; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export async function middleware(request: NextRequest) {
  const startTime = performance.now()

  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables")
      return NextResponse.next()
    }

    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/sanketa/signin",
      "/sanketa/signup",
      "/auth/callback",
      "/prarambha",
      "/api/health",
      "/api/auth/callback",
      "/api/auth/log-signin",
      "/legal/terms",
      "/legal/privacy",
      "/legal/refunds",
      "/legal/cancellation",
    ]

    // Static files and API routes - skip auth check for performance
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api/") ||
      pathname.includes(".") ||
      publicRoutes.includes(pathname)
    ) {
      return NextResponse.next()
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Get session token for caching
    const sessionToken =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("supabase-auth-token")?.value ||
      request.cookies.get("sb-localhost-auth-token")?.value ||
      "anonymous"

    // Check cache first
    const cached = sessionCache.get(sessionToken)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      // Use cached session
      if (!cached.session) {
        const redirectUrl = new URL("/sanketa/signin", request.url)
        redirectUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(redirectUrl)
      }

      const endTime = performance.now()
      console.log(`🔧 Middleware (cached) processed in ${Math.round(endTime - startTime)}ms`)
      return response
    }

    // Create Supabase client with enhanced error handling
    let supabase
    try {
      supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: "",
              ...options,
            })
          },
        },
      })
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      return NextResponse.next()
    }

    // Get session with enhanced error handling (no aggressive timeout)
    let session = null
    try {
      const {
        data: { session: userSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Session error:", error)
        // Cache the failure but don't block the request
        sessionCache.set(sessionToken, { session: null, timestamp: now })

        // For auth errors on protected routes, redirect to signin
        const redirectUrl = new URL("/sanketa/signin", request.url)
        redirectUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(redirectUrl)
      }

      session = userSession

      // Cache the result
      sessionCache.set(sessionToken, { session, timestamp: now })

      // Clean old cache entries periodically
      if (sessionCache.size > 100) {
        const entries = Array.from(sessionCache.entries())
        entries.forEach(([key, value]) => {
          if (now - value.timestamp > CACHE_DURATION * 2) {
            sessionCache.delete(key)
          }
        })
      }
    } catch (error) {
      console.error("Error getting session:", error)

      // Cache the failure to prevent repeated calls
      sessionCache.set(sessionToken, { session: null, timestamp: now })

      // For network/timeout errors, allow access to prevent blocking users
      if (
        error instanceof Error &&
        (error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("Session timeout"))
      ) {
        console.warn("Network/timeout error in middleware, allowing access")
        return response
      }

      // For other errors, redirect to signin
      const redirectUrl = new URL("/sanketa/signin", request.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect to login if not authenticated
    if (!session) {
      const redirectUrl = new URL("/sanketa/signin", request.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Skip additional database checks for performance and to prevent network errors
    const skipDbChecks = ["/samvaaha", "/dashboard", "/login", "/signup"].includes(pathname)
    if (skipDbChecks) {
      const endTime = performance.now()
      console.log(`🔧 Middleware (fast path) processed in ${Math.round(endTime - startTime)}ms`)
      return response
    }

    // Admin route protection (simplified)
    if (pathname.startsWith("/admin")) {
      try {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        if (!profile || !["SUPER_ADMIN", "ADMIN"].includes(profile.role)) {
          return NextResponse.redirect(new URL("/samvaaha", request.url))
        }
      } catch (error) {
        console.error("Error checking admin role:", error)
        // Allow access on error to prevent blocking
        return response
      }
    }

    const endTime = performance.now()
    console.log(`🔧 Middleware processed in ${Math.round(endTime - startTime)}ms`)

    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // On any middleware error, allow the request to proceed
    // This prevents the app from being completely blocked
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
