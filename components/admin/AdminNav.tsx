"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/payments", label: "Payments" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-1 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-1 mb-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
