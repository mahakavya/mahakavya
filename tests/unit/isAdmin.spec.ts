import { describe, it, expect, vi, beforeEach } from "vitest"
import { isAdmin } from "@/lib/auth/requireAdmin"

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

// Mock the is_admin function behavior
const mockIsAdmin = (role: string) => {
  return ["ADMIN", "SUPER_ADMIN", "MASTER_ADMIN"].includes(role)
}

describe("isAdmin utility", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns true for admin users", async () => {
    const mockSupabase = await import("@/lib/supabase/server")
    const createClient = mockSupabase.createClient as any

    createClient()
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "ADMIN" },
        error: null,
      })

    const result = await isAdmin("test-user-id")
    expect(result).toBe(true)
  })

  it("returns true for super admin users", async () => {
    const mockSupabase = await import("@/lib/supabase/server")
    const createClient = mockSupabase.createClient as any

    createClient()
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "SUPER_ADMIN" },
        error: null,
      })

    const result = await isAdmin("test-user-id")
    expect(result).toBe(true)
  })

  it("returns true for master admin users", async () => {
    const mockSupabase = await import("@/lib/supabase/server")
    const createClient = mockSupabase.createClient as any

    createClient()
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "MASTER_ADMIN" },
        error: null,
      })

    const result = await isAdmin("test-user-id")
    expect(result).toBe(true)
  })

  it("returns false for regular users", async () => {
    const mockSupabase = await import("@/lib/supabase/server")
    const createClient = mockSupabase.createClient as any

    createClient()
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "USER" },
        error: null,
      })

    const result = await isAdmin("test-user-id")
    expect(result).toBe(false)
  })

  it("returns false when profile not found", async () => {
    const mockSupabase = await import("@/lib/supabase/server")
    const createClient = mockSupabase.createClient as any

    createClient()
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: null,
        error: { message: "Profile not found" },
      })

    const result = await isAdmin("test-user-id")
    expect(result).toBe(false)
  })

  describe("isAdmin function", () => {
    it("returns true for ADMIN role", () => {
      expect(mockIsAdmin("ADMIN")).toBe(true)
    })

    it("returns true for SUPER_ADMIN role", () => {
      expect(mockIsAdmin("SUPER_ADMIN")).toBe(true)
    })

    it("returns true for MASTER_ADMIN role", () => {
      expect(mockIsAdmin("MASTER_ADMIN")).toBe(true)
    })

    it("returns false for USER role", () => {
      expect(mockIsAdmin("USER")).toBe(false)
    })

    it("returns false for invalid role", () => {
      expect(mockIsAdmin("INVALID")).toBe(false)
    })

    it("returns false for empty string", () => {
      expect(mockIsAdmin("")).toBe(false)
    })
  })
})
