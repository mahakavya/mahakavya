export const RECO = {
  // Weights (sum not required)
  wRecency: 0.45, // exponential decay by age (hours)
  wEngagement: 0.35, // likes+comments in last 6h (log scaled)
  wFollow: 0.15, // boost if you follow the author
  wTags: 0.15, // overlap with your recent interests

  // Decay & caps
  recencyHalfLifeH: 12, // half-life for decay
  maxPerAuthorPerPage: 2,

  // Cold-start fallbacks
  fallbackToLatest: true,
}
