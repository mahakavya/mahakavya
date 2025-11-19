export function linkifyText(text: string): string {
  // Simple linkify implementation
  // In a real app, you'd use a proper linkify library

  // URL regex
  const urlRegex = /(https?:\/\/[^\s]+)/g

  // Hashtag regex
  const hashtagRegex = /#(\w+)/g

  // Replace URLs
  let result = text.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>',
  )

  // Replace hashtags
  result = result.replace(hashtagRegex, '<span class="text-blue-500 font-medium">#$1</span>')

  return result
}
