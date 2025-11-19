"use client"

interface TypingDotsProps {
  users: string[]
}

export function TypingDots({ users }: TypingDotsProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`
    } else {
      return `${users[0]} and ${users.length - 1} others are typing...`
    }
  }

  return (
    <div className="px-4 py-2 text-sm text-gray-500" aria-live="polite">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span>{getTypingText()}</span>
      </div>
    </div>
  )
}
