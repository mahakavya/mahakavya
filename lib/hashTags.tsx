export function extractHashTags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex)

  if (!matches) return []

  return matches.map((tag) => tag.slice(1).toLowerCase()) // Remove # and convert to lowercase
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const matches = text.match(mentionRegex)

  if (!matches) return []

  return matches.map((mention) => mention.slice(1).toLowerCase()) // Remove @ and convert to lowercase
}

export function parseTextWithLinks(text: string) {
  // Split text by hashtags and mentions while preserving them
  const parts = text.split(/(\s+|#\w+|@\w+)/)

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <span key={index} className="text-blue-400 font-medium cursor-pointer hover:underline">
          {part}
        </span>
      )
    } else if (part.startsWith("@")) {
      return (
        <span key={index} className="text-purple-400 font-medium cursor-pointer hover:underline">
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}
