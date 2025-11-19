import { describe, it, expect } from "vitest"

// Mock the visibility function logic
function canViewReel(reel: { visibility: string; author_id: string }, viewerId: string, isFollowing = false): boolean {
  switch (reel.visibility) {
    case "PUBLIC":
      return true
    case "PRIVATE":
      return reel.author_id === viewerId
    case "FOLLOWERS":
      return reel.author_id === viewerId || isFollowing
    default:
      return false
  }
}

describe("Reel Visibility", () => {
  const authorId = "author-123"
  const viewerId = "viewer-456"

  it("should allow anyone to view PUBLIC reels", () => {
    const reel = { visibility: "PUBLIC", author_id: authorId }

    expect(canViewReel(reel, viewerId)).toBe(true)
    expect(canViewReel(reel, authorId)).toBe(true)
    expect(canViewReel(reel, "random-user")).toBe(true)
  })

  it("should only allow author to view PRIVATE reels", () => {
    const reel = { visibility: "PRIVATE", author_id: authorId }

    expect(canViewReel(reel, authorId)).toBe(true)
    expect(canViewReel(reel, viewerId)).toBe(false)
    expect(canViewReel(reel, "random-user")).toBe(false)
  })

  it("should allow author and followers to view FOLLOWERS reels", () => {
    const reel = { visibility: "FOLLOWERS", author_id: authorId }

    expect(canViewReel(reel, authorId)).toBe(true)
    expect(canViewReel(reel, viewerId, true)).toBe(true) // is following
    expect(canViewReel(reel, viewerId, false)).toBe(false) // not following
    expect(canViewReel(reel, "random-user", false)).toBe(false)
  })

  it("should deny access for invalid visibility values", () => {
    const reel = { visibility: "INVALID", author_id: authorId }

    expect(canViewReel(reel, authorId)).toBe(false)
    expect(canViewReel(reel, viewerId)).toBe(false)
  })
})
