import { describe, it, expect } from "vitest"
import { createSupabaseServerClient } from "../supabase-server"

describe("Supabase Server Client", () => {
  it("should create a server client", () => {
    const client = createSupabaseServerClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it("should use singleton pattern", () => {
    const client1 = createSupabaseServerClient()
    const client2 = createSupabaseServerClient()
    expect(client1).toBe(client2)
  })
})
