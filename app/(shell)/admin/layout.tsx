import type React from "react"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { AdminNav } from "@/components/admin/AdminNav"
import { PageHeader } from "@/components/page-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sb = createClient()
  const profile = await getCurrentProfile(sb)
  const isAdmin = profile?.is_admin || false

  return (
    <AdminGuard isAdmin={isAdmin}>
      <div className="space-y-6">
        <PageHeader title="Admin Console" subtitle="Manage users, content, and platform operations" />
        <AdminNav />
        {children}
      </div>
    </AdminGuard>
  )
}
