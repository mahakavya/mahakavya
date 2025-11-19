export const SAFETY = {
  profanity: [
    "abuse",
    "hate",
    "toxic",
    "spam",
    "scam",
    "fake",
    "fraud",
    "violence",
    "threat",
    "harassment",
    "bully",
    "offensive",
  ], // expand later with actual profanity list
  spamLinks: [
    /https?:\/\/\S{0,40}(casino|loan|token|crypto-airdrop|gambling|betting)/i,
    /https?:\/\/\S{0,40}(get-rich|make-money|earn-fast|quick-cash)/i,
    /https?:\/\/\S{0,40}(click-here|limited-time|act-now|urgent)/i,
  ],
  maxMentions: 10,
  autoHideScore: 0.9, // >= 0.9 => hide immediately
  flagScore: 0.6, // >= 0.6 => create flag for review
}
