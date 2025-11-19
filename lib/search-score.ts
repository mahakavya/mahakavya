export type SearchResult =
  | { kind: "post"; id: string; body: string; created_at: string; href: string; score: number; author: string }
  | {
      kind: "reel"
      id: string
      caption: string
      created_at: string
      href: string
      score: number
      thumb_url?: string
      author: string
    }
  | {
      kind: "campaign"
      id: string
      title: string
      created_at: string
      href: string
      score: number
      cover_url?: string
      goal_amount: number
      raised_amount: number
      creator: string
    }
