export function genCode(seed: string) {
  // short, URL-safe code (6–8 chars)
  const s = Buffer.from(seed)
    .toString("base64")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 8)
  const rand = Math.random().toString(36).slice(2, 6)
  return (s + rand).slice(0, 8).toUpperCase()
}
